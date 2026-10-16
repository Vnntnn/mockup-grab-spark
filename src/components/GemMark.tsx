/** `snap`: the two gems slide together once when the mark appears (a bond forming). Off by default; callers use it for a real arrival. */
export function GemMark({ className = 'size-9', snap = false }: { className?: string; snap?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <polygon className={snap ? 'gem-snap-a' : undefined} points="24,14 40,23 40,41 24,50 8,41 8,23" fill="#00b14f" />
      <polygon className={snap ? 'gem-snap-b' : undefined} points="40,14 56,23 56,41 40,50 24,41 24,23" fill="#161616" opacity=".92" />
    </svg>
  )
}

/** A merchant drawn as a gem. The glyph is the shop's first letter. */
export function Gem({ glyph, tone, className = 'size-16' }: { glyph: string; tone: 'self' | 'partner'; className?: string }) {
  const fill = tone === 'self' ? '#161616' : '#00b14f'
  const ink = tone === 'self' ? '#ffffff' : '#0a0a0a'
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <polygon points="32,2 58,17 58,47 32,62 6,47 6,17" fill={fill} />
      <polygon points="32,2 58,17 32,32" fill="#ffffff" opacity=".16" />
      <polygon points="32,32 58,47 32,62" fill="#000000" opacity=".12" />
      <text x="32" y="41" textAnchor="middle" fontSize="26" fontWeight="600" fill={ink} fontFamily="inherit">
        {glyph}
      </text>
    </svg>
  )
}
