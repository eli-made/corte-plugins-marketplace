import { describe, expect, it } from 'vitest'
import type { TimelineInfo } from '@corte/plugin-types'
import { BUILT_IN_TYPES, gradableClipIds, isMood, MOOD_PRESETS, MOODS } from './presets.ts'

describe('mood presets', () => {
  it('ships the five advertised moods', () => {
    expect(MOODS).toEqual(['cinematic', 'warm', 'cool', 'vivid', 'matte'])
  })

  it('only references built-in effect types', () => {
    // A typo here would apply an effect the host does not know, which fails
    // silently at render rather than at apply time.
    for (const [mood, steps] of Object.entries(MOOD_PRESETS)) {
      for (const step of steps) {
        expect(BUILT_IN_TYPES, `${mood} → ${step.type}`).toContain(step.type)
      }
    }
  })

  it('names each effect’s parameter correctly', () => {
    const paramFor: Record<string, string> = {
      'color.exposure': 'exposure',
      'color.contrast': 'contrast',
      'color.saturation': 'saturation',
      'color.temperature': 'temperature',
      'stylize.vignette': 'amount',
    }
    for (const [mood, steps] of Object.entries(MOOD_PRESETS)) {
      for (const step of steps) {
        expect(Object.keys(step.params), `${mood} → ${step.type}`).toEqual([paramFor[step.type]])
      }
    }
  })

  it('keeps every value inside the tasteful range the copy promises', () => {
    const range: Record<string, [number, number]> = {
      exposure: [-0.15, 0.15],
      contrast: [1.05, 1.15],
      saturation: [0.85, 1.2],
      temperature: [5200, 7500],
      amount: [0.2, 0.4],
    }
    for (const [mood, steps] of Object.entries(MOOD_PRESETS)) {
      for (const step of steps) {
        for (const [key, value] of Object.entries(step.params)) {
          const [min, max] = range[key]
          expect(value, `${mood} → ${step.type}.${key}`).toBeGreaterThanOrEqual(min)
          expect(value, `${mood} → ${step.type}.${key}`).toBeLessThanOrEqual(max)
        }
      }
    }
  })

  it('gives every mood the full five-step grade', () => {
    for (const steps of Object.values(MOOD_PRESETS)) {
      expect(steps.map((s) => s.type)).toEqual([...BUILT_IN_TYPES])
    }
  })

  it('recognises only real moods', () => {
    expect(isMood('cinematic')).toBe(true)
    expect(isMood('sepia')).toBe(false)
    expect(isMood(undefined)).toBe(false)
  })
})

describe('gradableClipIds', () => {
  const timeline: TimelineInfo = {
    id: 't1', name: 'T', fps: 30, width: 1920, height: 1080,
    durationFrames: 300, duration: '00:00:10:00',
    tracks: [
      {
        type: 'video',
        clips: [
          { id: 'a', mediaType: 'video', startFrame: 0, durationFrames: 150 },
          { id: 'b', mediaType: 'image', startFrame: 150, durationFrames: 150 },
          { id: 'title', mediaType: 'text', startFrame: 0, durationFrames: 60, text: 'Hi' },
        ],
      },
      { type: 'audio', clips: [{ id: 'm', mediaType: 'audio', startFrame: 0, durationFrames: 300 }] },
    ],
  }

  it('collects video and image clips but skips text and audio', () => {
    expect(gradableClipIds(timeline)).toEqual(['a', 'b'])
  })

  it('returns nothing for an empty timeline', () => {
    expect(gradableClipIds({ ...timeline, tracks: [] })).toEqual([])
  })
})
