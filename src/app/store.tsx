import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AppState } from '@/domain/types'
import { todayISO } from '@/lib/dates'
import { createInitialState, reduce, STATE_VERSION, type Action } from './reducer'

const KEY = 'gembond.demo.v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as AppState
      if (s.version === STATE_VERSION && s.plans && s.merchants) return s
    }
  } catch {
    /* storage blocked or corrupt: fall through to a fresh demo */
  }
  return createInitialState(todayISO())
}

/** dispatch returns false when the reducer rejected the action (state unchanged), so the UI never reports a success that did not happen. */
const Ctx = createContext<{ state: AppState; dispatch: (a: Action) => boolean } | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
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
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* demo still works without persistence */
    }
  }, [state])
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used inside AppProvider')
  return v
}
