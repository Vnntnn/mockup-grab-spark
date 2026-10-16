import { toast as base } from 'sonner'
import { translate } from './translate'

type Msg = Parameters<typeof base>[0]
const tr = (m: Msg): Msg => (typeof m === 'string' ? translate(m) : m)

/** sonner's toast with the message translated at the moment it is shown. Same API as the original. */
export const toast = Object.assign(
  (m: Msg, ...rest: Parameters<typeof base> extends [unknown, ...infer R] ? R : never) => (base as (...a: unknown[]) => unknown)(tr(m), ...rest),
  {
    success: (m: Msg, ...rest: Parameters<typeof base.success> extends [unknown, ...infer R] ? R : never) => base.success(tr(m), ...rest),
    info: (m: Msg, ...rest: Parameters<typeof base.info> extends [unknown, ...infer R] ? R : never) => base.info(tr(m), ...rest),
    error: (m: Msg, ...rest: Parameters<typeof base.error> extends [unknown, ...infer R] ? R : never) => base.error(tr(m), ...rest),
    warning: (m: Msg, ...rest: Parameters<typeof base.warning> extends [unknown, ...infer R] ? R : never) => base.warning(tr(m), ...rest),
  },
)
