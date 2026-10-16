import { getLang } from '@/i18n/lang'
import { translate } from '@/i18n/translate'

const nf = new Intl.NumberFormat('th-TH')
export const baht = (n: number) => `฿${nf.format(Math.round(n))}`
export const num = (n: number) => nf.format(Math.round(n))
export const signedPct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
export const signedBaht = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${baht(Math.abs(n))}`

const seg = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null
/** First visible character of a shop name, ignoring the "ร้าน" prefix. */
export function initial(name: string): string {
  if (getLang() === 'en') return translate(name).trim().charAt(0).toUpperCase()
  const s = name.replace(/^ร้าน/, '').trim() || name
  return seg ? [...seg.segment(s)][0].segment : s.charAt(0)
}
