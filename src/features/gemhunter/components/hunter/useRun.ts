import { useCallback } from 'react'
import { toast } from '@/i18n/toast'
import { apply, type Action } from '../../domain'
import { useGemHunter } from '../../store'

/**
 * Runs an action through `apply` first so a refusal can be explained with the reducer's own Thai reason.
 * Only dispatches (and toasts success) when the reducer accepts it. Never reports a success that did not happen.
 */
export function useRun() {
  const { state, dispatch } = useGemHunter()
  return useCallback(
    (action: Action, success?: string) => {
      const r = apply(state, action)
      if (!r.ok) {
        // a repeat of something already done is not an error: say so calmly
        if (r.code === 'already_exists' || r.code === 'already_opened') toast.info(r.reason)
        else toast.error(r.reason)
        return r
      }
      dispatch(action)
      if (success) toast.success(success)
      return r
    },
    [state, dispatch],
  )
}
