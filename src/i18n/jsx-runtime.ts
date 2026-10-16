import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime'
import { getLang } from './lang'
import { translate } from './translate'

export type { JSX } from 'react/jsx-runtime'
export { Fragment }

const TEXT_PROPS = ['aria-label', 'aria-description', 'aria-roledescription', 'title', 'placeholder', 'alt'] as const
const THAI = /[฀-๿]/

/** Joins neighbouring string/number children so a sentence with {values} is translated as one sentence. */
function translateChildren(children: unknown): unknown {
  if (typeof children === 'string') return translate(children)
  if (!Array.isArray(children)) return children
  const out: unknown[] = []
  let run: string | null = null
  const flush = () => {
    if (run !== null) out.push(translate(run))
    run = null
  }
  for (const c of children) {
    if (typeof c === 'string' || typeof c === 'number') run = (run ?? '') + String(c)
    else {
      flush()
      out.push(c)
    }
  }
  flush()
  return out
}

/** Every element React creates for the app passes through here, so Thai text and Thai accessible names are translated at render. */
export function localize<P>(_type: unknown, props: P): P {
  if (getLang() === 'th' || !props || typeof props !== 'object') return props
  const p = props as Record<string, unknown>
  let next: Record<string, unknown> | null = null
  if ('children' in p) {
    const c = translateChildren(p.children)
    if (c !== p.children) next = { ...p, children: c }
  }
  // accessible names are translated on components too (Radix and friends hand them to the DOM through their own runtime)
  for (const k of TEXT_PROPS) {
    const v = (next ?? p)[k]
    if (typeof v === 'string' && THAI.test(v)) {
      next = { ...(next ?? p), [k]: translate(v) }
    }
  }
  return (next ?? props) as P
}

export const jsx: typeof reactJsx = (type, props, key) => reactJsx(type, localize(type, props), key)
export const jsxs: typeof reactJsxs = (type, props, key) => reactJsxs(type, localize(type, props), key)
