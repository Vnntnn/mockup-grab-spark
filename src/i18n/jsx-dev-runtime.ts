import { Fragment, jsxDEV as reactJsxDEV } from 'react/jsx-dev-runtime'
import { getLang } from './lang'
import { localize } from './jsx-runtime'

export type { JSX } from 'react/jsx-dev-runtime'
export { Fragment }

/** Development runtime: same translation, but keeps React's source info for warnings. */
export const jsxDEV: typeof reactJsxDEV = (type, props, key, isStatic, source, self) => {
  if (getLang() === 'th') return reactJsxDEV(type, props, key, isStatic, source, self)
  return reactJsxDEV(type, localize(type, props), key, isStatic, source, self)
}
