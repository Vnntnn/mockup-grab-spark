import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Read-only rating. The number is printed, so the stars are never the only cue. */
export function StarRating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} role="img" aria-label={`${value} จาก 5 ดาว`}>
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className={cn('size-4', n <= value ? 'fill-foreground text-foreground' : 'text-input')} />
        ))}
      </span>
      <span className="text-[15px] font-medium tabular-nums" aria-hidden="true">{value}/5</span>
    </span>
  )
}

/** Accessible 1-5 radio group. Native radios, so keyboard (arrows) and screen readers work as expected. */
export function StarRatingInput({
  name,
  value,
  onChange,
  disabled,
  describedBy,
  invalid,
}: {
  name: string
  value: number
  onChange: (n: number) => void
  disabled?: boolean
  describedBy?: string
  invalid?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="ให้คะแนน 1 ถึง 5 ดาว" className="grid grid-cols-5 gap-2" aria-describedby={describedBy} aria-invalid={invalid}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label
          key={n}
          className={cn(
            'relative flex min-h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-1 py-1.5 text-[15px] has-[:checked]:border-foreground has-[:checked]:bg-accent has-[:checked]:font-bold has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <input type="radio" name={name} value={n} checked={value === n} disabled={disabled} onChange={() => onChange(n)} className="sr-only" />
          <Star className={cn('size-5', n <= value ? 'fill-foreground text-foreground' : 'text-input')} aria-hidden="true" />
          <span aria-hidden="true">{n} ดาว</span>
          <span className="sr-only">{n} ดาว</span>
        </label>
      ))}
    </div>
  )
}
