/** Two bars per day: before vs during. Numbers are printed on the bars, so colour is never the only cue. */
export function DailyBars({ before, during }: { before: number[]; during: number[] }) {
  const days = Math.max(before.length, during.length)
  const max = Math.max(...before, ...during, 1)
  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
        <span className="flex items-center gap-2"><span className="size-3.5 rounded-sm bg-sage-strong" aria-hidden="true" />ก่อนแคมเปญ</span>
        <span className="flex items-center gap-2"><span className="size-3.5 rounded-sm bg-forest" aria-hidden="true" />ช่วงแคมเปญ</span>
      </figcaption>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${days}, minmax(0, 1fr))` }} role="img" aria-label={`ออเดอร์รายวัน ก่อนแคมเปญ ${before.join(', ')} ช่วงแคมเปญ ${during.join(', ')}`}>
        {Array.from({ length: days }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              {[before[i], during[i]].map((v, k) => (
                <div key={k} className="flex h-full flex-1 flex-col items-center justify-end">
                  <span className="text-[13px] leading-none">{v ?? '–'}</span>
                  <div className={k === 0 ? 'w-full rounded-t bg-sage-strong' : 'w-full rounded-t bg-forest'} style={{ height: `${((v ?? 0) / max) * 100 * 0.82}%` }} />
                </div>
              ))}
            </div>
            <span className="text-[13px] text-muted-foreground">วัน {i + 1}</span>
          </div>
        ))}
      </div>
    </figure>
  )
}
