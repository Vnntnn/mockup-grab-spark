import { useCallback } from 'react'
import { toast } from 'sonner'
import { apply, type Action } from '../domain'
import { useGemHunter } from '../store'

/**
 * Runs an action, asking the domain first so a refusal can be explained in plain Thai.
 * Success toast only when the state really changed.
 */
export function useHunterAction() {
  const { state, dispatch } = useGemHunter()
  return useCallback(
    (action: Action, successMessage?: string): boolean => {
      const r = apply(state, action)
      if (!r.ok) {
        toast.error(r.reason)
        return false
      }
      if (!dispatch(action)) {
        toast.error('ทำรายการนี้ไม่ได้ในขั้นตอนปัจจุบัน')
        return false
      }
      if (successMessage) toast.success(successMessage)
      return true
    },
    [state, dispatch],
  )
}
