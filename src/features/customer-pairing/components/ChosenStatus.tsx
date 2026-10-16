import { baht } from '@/lib/format'
import { t } from '@/i18n/translate'
import type { PairingDish } from '../types'

/** Announces a choice to assistive technology, with the restaurant it belongs to. Visually hidden: the menu already shows the state. */
export function ChosenStatus({ owner, dish }: { owner: string; dish: PairingDish | undefined }) {
  return (
    <p aria-live="polite" className="sr-only">
      {dish ? t('เลือกแล้วจาก{0}: {1}, {2}', owner, dish.name, baht(dish.priceBaht)) : ''}
    </p>
  )
}
