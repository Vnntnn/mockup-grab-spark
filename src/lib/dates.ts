const noon = (iso: string) => new Date(`${iso}T12:00:00Z`)

export function addDays(iso: string, days: number): string {
  const d = noon(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const dayFmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const fullFmt = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export const fmtDay = (iso: string) => dayFmt.format(noon(iso.slice(0, 10)))
export const fmtFull = (iso: string) => fullFmt.format(noon(iso.slice(0, 10)))
export const fmtRange = (r: { start: string; end: string }) => `${fmtDay(r.start)} – ${fmtDay(r.end)}`

/** Whole days from a to b (b - a). */
export const daysBetween = (a: string, b: string) => Math.round((noon(b).getTime() - noon(a).getTime()) / 86400000)
