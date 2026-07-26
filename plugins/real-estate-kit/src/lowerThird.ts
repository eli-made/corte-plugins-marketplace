/**
 * The pure lower-third layout — separated from the plugin wiring so the frame
 * math can be unit tested without a sandbox.
 *
 * A listing lower third is three stacked lines (address, specs, price) that
 * cascade in a few frames apart and leave together. The sandbox's addText
 * carries content and timing only — no styling — so the address is upper-cased
 * to read as the headline against the sentence-case lines below it.
 */

export interface LowerThirdInput {
  /** Street address; the headline. Required — a lower third without it is noise. */
  address: string
  /** Optional stat line, e.g. "4 bd · 3 ba · 2,400 sqft". */
  specs?: string
  /** Optional price line, e.g. "$1,250,000". */
  price?: string
  /** When the block appears, in seconds (default 1). */
  atSeconds?: number
  /** How long it stays up, in seconds (default 4). */
  durationSeconds?: number
}

export interface LowerThirdLine {
  role: 'address' | 'specs' | 'price'
  content: string
  startFrame: number
  endFrame: number
}

const DEFAULT_AT_SECONDS = 1
const DEFAULT_DURATION_SECONDS = 4
/** Frames between each line's entrance — enough to read as a cascade at 24-60
 *  fps, short enough that the block still lands as one gesture. */
const CASCADE_FRAMES = 5
/** Used when the timeline reports an unusable fps, so text still gets sane timing. */
const FALLBACK_FPS = 30

export function buildLowerThird(input: LowerThirdInput, fps: number): LowerThirdLine[] {
  const rate = Number.isFinite(fps) && fps > 0 ? fps : FALLBACK_FPS
  const atFrame = Math.max(0, Math.round((input.atSeconds ?? DEFAULT_AT_SECONDS) * rate))
  const durationFrames = Math.max(1, Math.round((input.durationSeconds ?? DEFAULT_DURATION_SECONDS) * rate))
  const endFrame = atFrame + durationFrames

  // Specs and price hang off the address line; without it there is no block to
  // build, so nothing is written rather than a stray price floating on screen.
  const address = headline(input.address)
  if (address === '') return []

  const candidates: { role: LowerThirdLine['role']; content: string }[] = [
    { role: 'address', content: address },
    { role: 'specs', content: clean(input.specs) },
    { role: 'price', content: clean(input.price) },
  ]

  // Cascading by emitted position (not by role) means omitting the specs line
  // closes the gap instead of leaving a hole in the timing.
  return candidates
    .filter((line) => line.content !== '')
    .map((line, index) => ({
      ...line,
      // A block shorter than the cascade must not push a line past its own exit.
      startFrame: Math.min(atFrame + index * CASCADE_FRAMES, endFrame - 1),
      endFrame,
    }))
}

const clean = (value: string | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim()

const headline = (value: string | undefined): string => clean(value).toUpperCase()
