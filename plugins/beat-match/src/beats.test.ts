import { describe, expect, it } from 'vitest'
import { detectBeats, estimateBpm, nearestFrame } from './beats.ts'

const SAMPLE_RATE = 8000

/** A click track: silence with a short 1 kHz burst on every beat. */
function clickTrack(bpm: number, seconds: number, firstBeat = 0.5): Float32Array {
  const interval = 60 / bpm
  const samples = new Float32Array(Math.round(seconds * SAMPLE_RATE))
  const burstLength = Math.round(0.005 * SAMPLE_RATE)
  for (let t = firstBeat; t < seconds; t += interval) {
    const start = Math.round(t * SAMPLE_RATE)
    for (let i = 0; i < burstLength && start + i < samples.length; i++) {
      const decay = 1 - i / burstLength
      samples[start + i] = 0.9 * decay * Math.sin((2 * Math.PI * 1000 * i) / SAMPLE_RATE)
    }
  }
  return samples
}

/** Steady noise at a constant level — loud, but with no transients in it.
 *  Seeded so the test is deterministic. */
function flatNoise(seconds: number, amplitude = 0.2): Float32Array {
  let seed = 0x9e3779b9
  const samples = new Float32Array(Math.round(seconds * SAMPLE_RATE))
  for (let i = 0; i < samples.length; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    samples[i] = ((seed / 0xffffffff) * 2 - 1) * amplitude
  }
  return samples
}

describe('detectBeats', () => {
  it('finds every click of a 120 bpm track within 30 ms', () => {
    const beats = detectBeats(clickTrack(120, 4), SAMPLE_RATE)
    const expected = [0.5, 1, 1.5, 2, 2.5, 3, 3.5]

    expect(beats).toHaveLength(expected.length)
    for (const [i, want] of expected.entries()) {
      expect(Math.abs(beats[i] - want)).toBeLessThanOrEqual(0.03)
    }
  })

  it('tracks a faster tempo just as closely', () => {
    const beats = detectBeats(clickTrack(90, 4), SAMPLE_RATE)
    expect(beats).toHaveLength(6) // 0.5s .. 3.83s at 0.667s spacing
    expect(estimateBpm(beats)).toBeCloseTo(90, 0)
  })

  it('reports (almost) nothing for steady noise with no transients', () => {
    expect(detectBeats(flatNoise(4), SAMPLE_RATE).length).toBeLessThanOrEqual(1)
  })

  it('reports nothing for silence or for a buffer shorter than one frame', () => {
    expect(detectBeats(new Float32Array(SAMPLE_RATE), SAMPLE_RATE)).toEqual([])
    expect(detectBeats(new Float32Array(64), SAMPLE_RATE)).toEqual([])
  })

  it('never reports two beats closer together than the minimum spacing', () => {
    const beats = detectBeats(clickTrack(240, 4), SAMPLE_RATE, { minSpacingSeconds: 0.5 })
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i] - beats[i - 1]).toBeGreaterThanOrEqual(0.5)
    }
  })
})

describe('estimateBpm', () => {
  it('uses the median interval so one missed hit does not skew it', () => {
    expect(estimateBpm([0, 0.5, 1, 1.5, 2.5, 3])).toBe(120)
  })

  it('is undefined with fewer than two beats', () => {
    expect(estimateBpm([1])).toBeUndefined()
  })
})

describe('nearestFrame', () => {
  it('picks the closest beat frame and prefers the earlier one on a tie', () => {
    expect(nearestFrame([0, 15, 30], 22)).toBe(15)
    expect(nearestFrame([0, 15, 30], 23)).toBe(30)
    expect(nearestFrame([0, 20], 10)).toBe(0)
    expect(nearestFrame([], 5)).toBeUndefined()
  })
})
