import { Fragment, type ReactNode } from 'react'
import { useLang } from './lang'

/** Remounts its subtree when the language changes, so every string is looked up again. App state lives above it. */
export function LangRoot({ children }: { children: ReactNode }) {
  const lang = useLang()
  return <Fragment key={lang}>{children}</Fragment>
}
