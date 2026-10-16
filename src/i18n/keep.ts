import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

/**
 * useState for things a visitor would be annoyed to lose when switching language: an open dialog, a half-typed note.
 * The language switch remounts the tree, so these values are carried across it by key. Anywhere else it behaves like useState.
 */
const live = new Map<string, unknown>()
let carry = new Map<string, unknown>()
let clearTimer: ReturnType<typeof setTimeout> | undefined

/** Called by setLang just before the tree remounts: what is registered now is offered to the new tree, once. */
export function carryStateAcrossSwitch(): void {
  carry = new Map(live)
  live.clear()
  clearTimeout(clearTimer)
  clearTimer = setTimeout(() => carry.clear(), 800)
}

export function useKept<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => (carry.has(key) ? (carry.get(key) as T) : typeof initial === 'function' ? (initial as () => T)() : initial))
  useEffect(() => {
    live.set(key, value)
  }, [key, value])
  useEffect(() => () => void live.delete(key), [key])
  return [value, setValue]
}
