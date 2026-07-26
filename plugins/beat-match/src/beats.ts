/**
 * The pure beat-detection logic — separated from the plugin wiring so it can be
 * unit tested without a sandbox or an audio decoder.
 *
 * The method is energy-flux onset detection, chosen because the host hands the
 * worker mono PCM downsampled to ~8 kHz: enough for percussive transients,
 * nowhere near enough for spectral analysis. It runs in one pass, allocates
 * three arrays, and is fully deterministic — same samples in, same beats out.
 *
 *   1. RMS envelope over ~1024-sample frames (50 % overlap).
 *   2. Positive flux: how much louder each frame is than the one before it.
 *   3. Adaptive threshold: mean + k·stddev of flux over a sliding ~1 s
 *      neighbourhood, so a quiet intro and a loud drop are judged on their own
 *      terms rather than against one global level.
 *   4. A transient gate (the frame must be materially louder than its
 *      predecessor) rejects the few-percent frame-to-frame wobble of steady
 *      material — room tone, a sustained pad — which would otherwise clear a
 *      threshold built from that same tiny variance.
 *   5. Sub-frame refinement, then a minimum spacing so one hit reports once.
 */

export interface BeatDetectOptions {
  /** Analysis frame in samples at the delivered rate (default 1024). */
  frameSize?: number
  /** Minimum time between reported beats, in seconds (default 0.25 → 240 bpm). */
  minSpacingSeconds?: number
  /** Standard deviations above the local mean flux a peak must reach (default 1.5). */
  thresholdK?: number
  /** Width of the sliding threshold neighbourhood, in seconds (default 1). */
  neighborhoodSeconds?: number
  /** How much louder a frame must be than its predecessor to count as a
   *  transient, as a ratio of RMS (default 1.3). */
  minRiseRatio?: number
}

const DEFAULTS = {
  frameSize: 1024,
  minSpacingSeconds: 0.25,
  thresholdK: 1.5,
  neighborhoodSeconds: 1,
  minRiseRatio: 1.3,
} as const

/** How finely a detected frame is searched for the exact onset. 1/16 of a
 *  1024-sample frame is 8 ms at 8 kHz — well inside a frame's own resolution. */
const REFINE_DIVISIONS = 16

/** Beat positions in seconds, ascending. */
export function detectBeats(
  samples: Float32Array,
  sampleRate: number,
  opts: BeatDetectOptions = {},
): number[] {
  const frameSize = Math.max(16, Math.floor(opts.frameSize ?? DEFAULTS.frameSize))
  const hop = Math.max(1, Math.floor(frameSize / 2))
  const minSpacing = opts.minSpacingSeconds ?? DEFAULTS.minSpacingSeconds
  const k = opts.thresholdK ?? DEFAULTS.thresholdK
  const neighborhood = opts.neighborhoodSeconds ?? DEFAULTS.neighborhoodSeconds
  const minRiseRatio = opts.minRiseRatio ?? DEFAULTS.minRiseRatio

  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || samples.length < frameSize) return []

  const frameCount = Math.floor((samples.length - frameSize) / hop) + 1
  const rms = new Float64Array(frameCount)
  for (let f = 0; f < frameCount; f++) {
    const start = f * hop
    let sum = 0
    for (let i = start; i < start + frameSize; i++) sum += samples[i] * samples[i]
    rms[f] = Math.sqrt(sum / frameSize)
  }

  // Frame 0 is compared against silence, so audio that starts loud reports a
  // beat at its first frame rather than losing the downbeat.
  const flux = new Float64Array(frameCount)
  for (let f = 0; f < frameCount; f++) flux[f] = Math.max(0, rms[f] - (f === 0 ? 0 : rms[f - 1]))

  const halfWindow = Math.max(1, Math.round((neighborhood * sampleRate) / (2 * hop)))
  const beats: number[] = []
  let lastBeat = -Infinity

  for (let f = 0; f < frameCount; f++) {
    if (flux[f] <= 0) continue

    const lo = Math.max(0, f - halfWindow)
    const hi = Math.min(frameCount - 1, f + halfWindow)
    const n = hi - lo + 1
    let sum = 0
    for (let i = lo; i <= hi; i++) sum += flux[i]
    const mean = sum / n
    let variance = 0
    for (let i = lo; i <= hi; i++) variance += (flux[i] - mean) ** 2
    const stddev = Math.sqrt(variance / n)
    if (flux[f] < mean + k * stddev) continue

    // Rising out of silence (prev = 0) always passes; steady material does not.
    const prev = f === 0 ? 0 : rms[f - 1]
    if (rms[f] < minRiseRatio * prev) continue

    const seconds = refineOnsetSeconds(samples, f * hop, frameSize, sampleRate)
    // Overlapping frames catch the same hit twice; spacing keeps the first.
    if (seconds - lastBeat < minSpacing) continue
    beats.push(seconds)
    lastBeat = seconds
  }

  return beats
}

/** Median inter-beat interval expressed in bpm, or undefined when there are
 *  too few beats to imply a tempo. The median (not the mean) so a missed or
 *  doubled hit shifts the estimate by nothing. */
export function estimateBpm(beats: number[]): number | undefined {
  if (beats.length < 2) return undefined
  const intervals = []
  for (let i = 1; i < beats.length; i++) intervals.push(beats[i] - beats[i - 1])
  intervals.sort((a, b) => a - b)
  const mid = intervals.length >> 1
  const median =
    intervals.length % 2 === 1 ? intervals[mid] : (intervals[mid - 1] + intervals[mid]) / 2
  if (median <= 0) return undefined
  return Math.round((60 / median) * 10) / 10
}

/** The value in `frames` closest to `target`; ties go to the earlier frame.
 *  Undefined only when there are no frames to snap to. */
export function nearestFrame(frames: number[], target: number): number | undefined {
  let best: number | undefined
  let bestDistance = Infinity
  for (const frame of frames) {
    const distance = Math.abs(frame - target)
    if (distance < bestDistance) {
      best = frame
      bestDistance = distance
    }
  }
  return best
}

/** Locates the onset inside a detected frame by finding the largest rise in a
 *  fine-grained RMS envelope. Without this, every beat would be quantized to
 *  the frame grid (128 ms at 8 kHz) — far too coarse to cut against. */
function refineOnsetSeconds(
  samples: Float32Array,
  frameStart: number,
  frameSize: number,
  sampleRate: number,
): number {
  const step = Math.max(1, Math.floor(frameSize / REFINE_DIVISIONS))
  const end = Math.min(samples.length, frameStart + frameSize)

  let bestStart = frameStart
  let bestRise = -Infinity
  let previous = 0
  for (let start = frameStart; start + step <= end; start += step) {
    let sum = 0
    for (let i = start; i < start + step; i++) sum += samples[i] * samples[i]
    const level = Math.sqrt(sum / step)
    const rise = level - previous
    if (rise > bestRise) {
      bestRise = rise
      bestStart = start
    }
    previous = level
  }
  return bestStart / sampleRate
}
