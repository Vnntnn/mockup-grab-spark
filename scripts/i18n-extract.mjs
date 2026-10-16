// Lists every Thai string in src (non-test .ts/.tsx) as a translation key: exact text, or a pattern with {0},{1}
// where an expression is interpolated. Used by `npm run i18n:list` and by the coverage test.
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const THAI = /[฀-๿]/

/** JSX whitespace rules: lines are trimmed, blank lines dropped, the rest joined with a single space. */
function cleanJsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/)
  let out = ''
  const last = lines.length - 1
  lines.forEach((line, i) => {
    let l = line.replace(/\t/g, ' ')
    if (i !== 0) l = l.replace(/^[ ]+/, '')
    if (i !== last) l = l.replace(/[ ]+$/, '')
    if (l) {
      if (i !== last && out === '') out = l
      else out += (i !== 0 && out && !out.endsWith(' ') && lines.slice(0, i).some((x) => x.trim()) ? ' ' : '') + l
    }
  })
  return out
}

export function extractFromSource(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const found = []
  const add = (key, node) => {
    if (!key || !THAI.test(key)) return
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf))
    found.push({ key, file, line: line + 1 })
  }

  function templateKey(node) {
    let key = node.head.text
    node.templateSpans.forEach((sp, i) => {
      key += `{${i}}` + sp.literal.text
    })
    return key
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) || (ts.isExportDeclaration(node) && node.moduleSpecifier)) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) add(node.text, node)
    else if (ts.isTemplateExpression(node)) add(templateKey(node), node)
    else if (ts.isJsxElement(node) || ts.isJsxFragment(node)) collectRuns(node.children)
    ts.forEachChild(node, visit)
  }

  // neighbouring text and {expression} children are rendered as one string by the runtime, so they are one key
  function collectRuns(children) {
    let run = ''
    let n = 0
    let hasThai = false
    let first = null
    const flush = () => {
      if (hasThai && run.trim()) add(run, first)
      run = ''
      n = 0
      hasThai = false
      first = null
    }
    for (const c of children) {
      if (ts.isJsxText(c)) {
        const raw = c.text
        if (!raw.trim()) {
          // whitespace-only text between expressions on one line keeps its spaces; across lines it vanishes
          if (!/[\r\n]/.test(raw) && run) run += raw
          continue
        }
        const cleaned = cleanJsxText(raw)
        if (THAI.test(cleaned)) hasThai = true
        if (!first) first = c
        // JSX keeps a leading/trailing space only when it sits on the same line as its neighbour
        const lead = /^[ \t]+\S/.test(raw) && !/^\s*[\r\n]/.test(raw) ? ' ' : ''
        const trail = /\S[ \t]+$/.test(raw) && !/[\r\n]\s*$/.test(raw) ? ' ' : ''
        run += lead + cleaned.trim() + trail
      } else if (ts.isJsxExpression(c) && c.expression) {
        const e = c.expression
        if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) {
          // {' '} and literal strings render as text in the run
          if (!first) first = c
          if (THAI.test(e.text)) hasThai = true
          run += e.text
        } else if (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e) || ts.isJsxFragment(e)) {
          flush()
        } else {
          if (!first) first = c
          run += `{${n++}}`
        }
      } else {
        flush()
      }
    }
    flush()
  }

  visit(sf)
  return found
}

export function extractAll(root = 'src') {
  const out = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && !p.includes(`${path.sep}i18n${path.sep}`)) {
        out.push(...extractFromSource(p, fs.readFileSync(p, 'utf8')))
      }
    }
  }
  walk(root)
  return out
}

if (process.argv[1] && process.argv[1].endsWith('i18n-extract.mjs')) {
  const all = extractAll()
  const byKey = new Map()
  for (const f of all) {
    if (!byKey.has(f.key)) byKey.set(f.key, [])
    byKey.get(f.key).push(`${f.file.replace(/^src\//, '')}:${f.line}`)
  }
  const mode = process.argv[2]
  if (mode === 'json') console.log(JSON.stringify([...byKey.entries()].map(([key, where]) => ({ key, where })), null, 1))
  else for (const [key, where] of byKey) console.log(`${where[0]}\t${JSON.stringify(key)}`)
  console.error(`${byKey.size} unique Thai keys`)
}
