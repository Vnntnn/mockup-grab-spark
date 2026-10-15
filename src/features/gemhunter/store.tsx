import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { createInitialState, reduce, STATE_VERSION, type Action } from './domain/reducer'
import type { GemHunterState } from './domain/types'

// Separate from the GemBond demo key: resetting one never touches the other.
export const GEMHUNTER_STORAGE_KEY = 'gembond.gemhunter.v1'

function load(): GemHunterState {
  try {
    const raw = localStorage.getItem(GEMHUNTER_STORAGE_KEY)
    if (raw) {
      const s = JSON.parse(raw) as GemHunterState
      if (s.version === STATE_VERSION && s.campaign?.menuAudit && s.campaign.submissions) return s
    }
  } catch {
    /* storage blocked or corrupt: fall through to a fresh demo */
  }
  return createInitialState()
}

/** dispatch returns false when the reducer rejected the action (state unchanged), so the UI never reports a success that did not happen. */
const Ctx = createContext<{ state: GemHunterState; dispatch: (a: Action) => boolean } | null>(null)

export function GemHunterProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reduce, undefined, load)
  const dispatch = useCallback(
    (a: Action) => {
      if (reduce(state, a) === state) return false
      rawDispatch(a)
      return true
    },
    [state],
  )
  useEffect(() => {
    try {
      localStorage.setItem(GEMHUNTER_STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* demo still works without persistence */
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGemHunter() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useGemHunter must be used inside GemHunterProvider')
  return v
}
