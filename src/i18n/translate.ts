import { EN } from './en'
import { getLang } from './lang'

const THAI = /[฀-๿]/

/**
 * Thai is the source language of every string in the app. English is looked up at render time:
 *   1. an exact entry in EN ("ภาพรวม" -> "Overview"),
 *   2. a pattern entry with {0}, {1} placeholders ("ผ่าน {0} จาก {1}") whose captured parts are translated too,
 *   3. otherwise the Thai text is left as it is (and the coverage test / DOM scan flags it).
 * Thai mode never touches a string.
 */
type Pattern = { re: RegExp; out: string; weight: number }

let patterns: Pattern[] | null = null
function compile(): Pattern[] {
  if (patterns) return patterns
  // a trailing or leading {n} may be absent at run time (`text {cond && <b/>}` leaves only the text), so those keys also match without it
  const entries: Array<[string, string]> = []
  for (const [k, out] of Object.entries(EN)) {
    if (!/\{\d+\}/.test(k)) continue
    entries.push([k, out])
    for (const edge of [/\{(\d+)\}\s*$/, /^\s*\{(\d+)\}/]) {
      const m = edge.exec(k)
      const bare = k.replace(edge, '')
      if (m && bare.trim() && (k.match(/\{\d+\}/g) ?? []).length === 1) {
        entries.push([bare.trim(), out.replace(new RegExp(`\\s*\\{${m[1]}\\}\\s*`, 'g'), ' ').trim()])
      }
    }
  }
  patterns = entries
    .map(([k, out]) => {
      const literal = k.replace(/\{\d+\}/g, '')
      const re = new RegExp(
        '^' + k.split(/(\{\d+\})/).map((p) => (/^\{\d+\}$/.test(p) ? '([\\s\\S]+?)' : p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('') + '$',
      )
      return { re, out, weight: literal.length }
    })
    .sort((a, b) => b.weight - a.weight)
  return patterns
}

const cache = new Map<string, string>()
const active = new Set<string>()

export function translate(s: string): string {
  if (!THAI.test(s) || getLang() === 'th') return s
  const hit = cache.get(s)
  if (hit !== undefined) return hit
  if (active.has(s)) return s // a fallback asked about the very string it is working on
  active.add(s)
  let out: string
  try {
    out = singularise(lookup(s))
  } finally {
    active.delete(s)
  }
  if (cache.size < 5000) cache.set(s, out)
  return out
}

function lookup(s: string): string {
  const exact = EN[s]
  if (exact !== undefined) return exact
  const trimmed = s.trim()
  if (trimmed !== s && EN[trimmed] !== undefined) return s.replace(trimmed, EN[trimmed])
  for (const p of compile()) {
    const m = p.re.exec(s)
    if (m) return p.out.replace(/\{(\d+)\}/g, (_, i) => translate(m[Number(i) + 1] ?? ''))
  }
  // Fallbacks for composed text. Each one translates the parts it can see; the first that leaves no Thai wins,
  // otherwise the one that left the least.
  let best = s
  let bestLeft = thaiCount(s)
  for (const attempt of FALLBACKS) {
    const out = attempt(s, trimmed)
    if (out === null) continue
    const left = thaiCount(out)
    if (left < bestLeft) {
      best = out
      bestLeft = left
      if (left === 0) break
    }
  }
  return best
}

const COUNTED = 'reviews|photos|items|days|restaurants|pairings|points|orders|times|plans|characters|stars|skewers|hours|clicks|titles|requests|steps|checks|matters|campaigns'
/** Counts are filled into the sentence as numbers, so "1 reviews" is fixed here instead of in every entry. */
const singularise = (x: string) => x.replace(new RegExp(`(?<![\\d.,])1 (${COUNTED})\\b`, 'g'), (_m, w: string) => `1 ${w.slice(0, -1)}`)

const thaiCount = (x: string) => (x.match(/[\u0E01-\u0E3A\u0E40-\u0E5B]/g) ?? []).length

type Fallback = (s: string, trimmed: string) => string | null
const FALLBACKS: Fallback[] = [
  // "a · b", "a – b", "a + b", "a, b", "a / b": the parts of a list
  (s) => {
    const parts = s.split(/( · | – | \+ |, | \/ )/)
    return parts.length > 1 ? parts.map((p, i) => (i % 2 ? p : translate(p))).join('') : null
  },
  // “quoted” and (parenthesised) wholes
  (s, trimmed) => {
    const m = /^([“"(]\s*)([\s\S]+?)(\s*[”")])$/.exec(trimmed)
    return m ? s.replace(trimmed, m[1] + translate(m[2]) + m[3]) : null
  },
  // trailing colon
  (s, trimmed) => {
    const m = /^([\s\S]+?)([:：]\s*)$/.exec(trimmed)
    return m ? s.replace(trimmed, translate(m[1]) + m[2]) : null
  },
  // leading dash
  (s, trimmed) => {
    const m = /^([—–-]\s*)([\s\S]+)$/.exec(trimmed)
    return m ? s.replace(trimmed, m[1] + translate(m[2])) : null
  },
  // "label (note)" and "(note) label": the note as a whole first (keys may carry its parentheses and space), then its inside
  (s) => {
    const parts = s.split(/( ?\([^()]*\) ?)/)
    if (parts.length < 2) return null
    return parts
      .map((p) => {
        if (!/^ ?\(/.test(p)) return translate(p)
        const whole = translate(p)
        return whole !== p ? whole : p.replace(/\(([^()]*)\)/, (_m, inner: string) => `(${translate(inner)})`)
      })
      .join('')
  },
  // "label: value"
  (s, trimmed) => {
    const m = /^([^:：]+)(: )([\s\S]+)$/.exec(trimmed)
    return m ? s.replace(trimmed, translate(m[1]) + m[2] + translate(m[3])) : null
  },
  // sentences joined by spaces: cover the string with the longest known phrases
  (s) => {
    const words = s.split(' ')
    if (words.length < 2) return null
    const cover: Array<string[] | null> = new Array(words.length + 1).fill(null)
    cover[0] = []
    for (let i = 0; i < words.length; i++) {
      const prev = cover[i]
      if (!prev) continue
      for (let j = Math.min(words.length, i + 14); j > i; j--) {
        const hit = EN[words.slice(i, j).join(' ')]
        const cur = cover[j]
        if (hit !== undefined && (cur === null || cur.length > prev.length + 1)) cover[j] = [...prev, hit]
      }
    }
    return cover[words.length]?.join(' ') ?? null
  },
]

/** Explicit, language-aware formatting for text built in code: `t('เลือก{0}จาก{1}', pick, name)`. Thai fills the placeholders as they are. */
export function t(key: string, ...args: Array<string | number>): string {
  const base = getLang() === 'th' ? key : (EN[key] ?? translate(key))
  const filled = base.replace(/\{(\d+)\}/g, (_, i) => translate(String(args[Number(i)] ?? '')))
  return getLang() === 'th' ? filled : singularise(filled)
}

export function clearTranslationCache(): void {
  cache.clear()
}
