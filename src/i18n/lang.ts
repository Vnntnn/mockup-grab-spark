import { useSyncExternalStore } from 'react'
import { carryStateAcrossSwitch } from './keep'

export type Lang = 'th' | 'en'
const KEY = 'gembond.lang'

function initial(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q === 'en' || q === 'th') {
      try {
        window.localStorage.setItem(KEY, q) // a shared ?lang= link also sets the visitor's choice
      } catch {
        /* storage blocked */
      }
      return q
    }
    const v = window.localStorage.getItem(KEY)
    if (v === 'en' || v === 'th') return v
  } catch {
    /* no window or no storage: default below */
  }
  return 'th'
}

let current: Lang = initial()
const listeners = new Set<() => void>()
if (typeof document !== 'undefined') document.documentElement.lang = current

export const getLang = (): Lang => current

/** Switches the language everywhere: persists it, updates <html lang>, and tells subscribers (LangRoot remounts the tree). */
export function setLang(next: Lang): void {
  if (next === current) return
  carryStateAcrossSwitch()
  current = next
  try {
    window.localStorage.setItem(KEY, next)
  } catch {
    /* storage blocked: the choice lasts for this visit */
  }
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    root.lang = next
    // the tree remounts: mute entrance animations for a moment so the switch does not replay them
    root.classList.add('lang-switching')
    window.setTimeout(() => root.classList.remove('lang-switching'), 450)
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useLang = (): Lang => useSyncExternalStore(subscribe, getLang, () => 'th')

// The tree remounts on a switch, which drops focus. The toggle asks to be refocused once it is back.
let refocus = false
export const requestToggleFocus = () => { refocus = true }
export const takeToggleFocus = () => { const r = refocus; refocus = false; return r }
