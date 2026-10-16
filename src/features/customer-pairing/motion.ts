import { flushSync } from 'react-dom'

/**
 * One small motion helper for the dish steps: when a dish is chosen, a copy of its plate travels to that restaurant's slot in
 * the pinned pair bar, so the choice visibly lands where the pair is being built. It confirms a selection that has already
 * been made; it never blocks input (pointer-events: none, no waiting) and it is skipped for reduced motion. It is not an
 * "added to cart": nothing is ordered or paid in this prototype.
 */
let inFlight: Animation | null = null
let clone: HTMLElement | null = null

export function flyPlate(from: Element | null | undefined, to: Element | null | undefined): void {
  if (typeof document === 'undefined' || typeof window === 'undefined' || !from || !to) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  if (a.width === 0 || b.width === 0) return

  inFlight?.cancel()
  clone?.remove()

  const el = from.cloneNode(true) as HTMLElement
  el.setAttribute('aria-hidden', 'true')
  Object.assign(el.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    margin: '0',
    pointerEvents: 'none',
    zIndex: '60',
    transformOrigin: 'center',
  })
  document.body.appendChild(el)
  clone = el

  const dx = b.left + 16 - (a.left + a.width / 2)
  const dy = b.top + b.height / 2 - (a.top + a.height / 2)
  if (typeof el.animate !== 'function') {
    el.remove()
    return
  }
  const anim = el.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.28)`, opacity: 0.2 },
    ],
    { duration: 340, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
  )
  inFlight = anim
  const done = () => {
    el.remove()
    if (clone === el) clone = null
    if (inFlight === anim) inFlight = null
  }
  anim.onfinish = done
  anim.oncancel = done
}

/**
 * A short cross-fade for the two milestone transitions in the customer journey:
 * leaving the discovery map/list for the dish steps, and advancing from step 3 to the paired result.
 * Uses the browser's View Transitions API when available and skips immediately under reduced motion.
 */
export function withViewTransition(run: () => void): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    run()
    return
  }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (
    document.visibilityState === 'hidden' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
    typeof doc.startViewTransition !== 'function'
  ) {
    run()
    return
  }
  let ran = false
  const exec = () => {
    if (ran) return
    ran = true
    flushSync(run)
  }
  try {
    doc.startViewTransition(exec)
  } catch {
    exec()
  }
  setTimeout(exec, 80)
}
