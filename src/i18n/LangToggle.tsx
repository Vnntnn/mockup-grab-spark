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
    <div
      role="group"
      aria-label="ภาษา / Language"
      className={cn(
        'relative my-1.5 inline-grid shrink-0 grid-cols-2 items-center rounded-md border border-border bg-secondary/60 p-0.5',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pr-slide pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-[5px] bg-ink',
          lang === 'en' && 'translate-x-full',
        )}
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
            'pr-press relative z-10 inline-flex h-7 min-w-8 cursor-pointer items-center justify-center rounded-[5px] px-2 text-[13px] leading-none font-semibold transition-colors duration-[var(--dur-micro)] outline-none focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:h-7.5 sm:min-w-9 sm:px-2.5',
            lang === o.lang ? 'text-white' : 'text-ink hover:bg-muted/70',
          )}
        >
          {o.text}
        </button>
      ))}
    </div>
  )
}
