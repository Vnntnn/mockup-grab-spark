import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { requestToggleFocus, takeToggleFocus, useLang, setLang, type Lang } from './lang'

const OPTIONS: { lang: Lang; text: string; label: string }[] = [
  { lang: 'th', text: 'ไทย', label: 'ภาษาไทย' },
  { lang: 'en', text: 'EN', label: 'English' },
]

/** TH / EN switch. Labels stay in their own language (identity entries in en/extra.ts keep them untranslated). */
export function LangToggle({ className }: { className?: string }) {
  const lang = useLang()
  const active = useRef<HTMLButtonElement>(null)
  useLayoutEffect(() => {
    if (takeToggleFocus()) active.current?.focus()
  }, [])
  return (
    <div role="group" aria-label="ภาษา / Language" className={cn('relative grid grid-cols-2 shrink-0 overflow-hidden rounded-lg border border-border bg-card', className)}>
      <span
        aria-hidden="true"
        className={cn('pr-slide pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-ink', lang === 'en' && 'translate-x-full')}
      />
      {OPTIONS.map((o) => (
        <button
          key={o.lang}
          type="button"
          ref={lang === o.lang ? active : undefined}
          lang={o.lang}
          aria-pressed={lang === o.lang}
          aria-label={o.label}
          onClick={() => {
            if (o.lang === lang) return
            requestToggleFocus()
            setLang(o.lang)
          }}
          className={cn(
            'pr-press relative z-10 inline-flex min-h-11 min-w-10 cursor-pointer items-center justify-center px-2 text-[15px] font-semibold transition-colors duration-[var(--dur-micro)] outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-w-11 sm:px-3',
            lang === o.lang ? 'text-white' : 'text-ink hover:bg-muted/70',
          )}
        >
          {o.text}
        </button>
      ))}
    </div>
  )
}
