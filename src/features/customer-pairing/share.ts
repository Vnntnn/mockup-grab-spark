export type ShareOutcome = 'shared' | 'cancelled' | 'copied' | 'failed'

export interface ShareInput {
  title: string
  text: string
  url: string
}

/**
 * Native share first. The user closing the sheet (AbortError) is not an error. Any other share failure,
 * or no Web Share support, falls back to the clipboard. No Clipboard API or a denied write is reported as 'failed'.
 */
export async function sharePairingLink(input: ShareInput): Promise<ShareOutcome> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(input)
      return 'shared'
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(input.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
