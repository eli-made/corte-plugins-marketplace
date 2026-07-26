/**
 * The five mood presets, and the small amount of timeline reasoning that goes
 * with them. Kept pure and separate from the sandbox wiring so the values that
 * actually decide how a cut looks can be unit tested.
 *
 * Every step targets a BUILT-IN Corte effect. That is deliberate: a preset made
 * of built-ins survives this plugin being uninstalled, keeps working in the
 * export renderer, and stays editable from the Adjust panel afterwards.
 */
import type { TimelineInfo } from '@corte/plugin-types'

export interface GradeStep {
  type: (typeof BUILT_IN_TYPES)[number]
  params: Record<string, number>
}

/** The only effect types a preset may reference. */
export const BUILT_IN_TYPES = [
  'color.exposure',
  'color.contrast',
  'color.saturation',
  'color.temperature',
  'stylize.vignette',
] as const

export type Mood = 'cinematic' | 'warm' | 'cool' | 'vivid' | 'matte'

/**
 * Values are intentionally conservative — a mood should read as a grade someone
 * chose, not as a filter. Temperature is in kelvin and the host's white balance
 * runs higher = warmer (gains are derived from `temperature − 6500`), so 5300 K
 * cools the frame and 7200 K warms it.
 */
export const MOOD_PRESETS: Record<Mood, GradeStep[]> = {
  cinematic: [
    { type: 'color.exposure', params: { exposure: -0.05 } },
    { type: 'color.contrast', params: { contrast: 1.12 } },
    { type: 'color.saturation', params: { saturation: 0.92 } },
    { type: 'color.temperature', params: { temperature: 6200 } },
    { type: 'stylize.vignette', params: { amount: 0.35 } },
  ],
  warm: [
    { type: 'color.exposure', params: { exposure: 0.05 } },
    { type: 'color.contrast', params: { contrast: 1.06 } },
    { type: 'color.saturation', params: { saturation: 1.08 } },
    { type: 'color.temperature', params: { temperature: 7200 } },
    { type: 'stylize.vignette', params: { amount: 0.22 } },
  ],
  cool: [
    { type: 'color.exposure', params: { exposure: 0 } },
    { type: 'color.contrast', params: { contrast: 1.08 } },
    { type: 'color.saturation', params: { saturation: 0.95 } },
    { type: 'color.temperature', params: { temperature: 5300 } },
    { type: 'stylize.vignette', params: { amount: 0.25 } },
  ],
  vivid: [
    { type: 'color.exposure', params: { exposure: 0.08 } },
    { type: 'color.contrast', params: { contrast: 1.15 } },
    { type: 'color.saturation', params: { saturation: 1.2 } },
    { type: 'color.temperature', params: { temperature: 6500 } },
    { type: 'stylize.vignette', params: { amount: 0.2 } },
  ],
  matte: [
    { type: 'color.exposure', params: { exposure: 0.1 } },
    { type: 'color.contrast', params: { contrast: 1.05 } },
    { type: 'color.saturation', params: { saturation: 0.85 } },
    { type: 'color.temperature', params: { temperature: 6800 } },
    { type: 'stylize.vignette', params: { amount: 0.4 } },
  ],
}

export const MOODS = Object.keys(MOOD_PRESETS) as Mood[]

export function isMood(value: unknown): value is Mood {
  return typeof value === 'string' && value in MOOD_PRESETS
}

/**
 * Every clip on the timeline a grade can meaningfully land on. Text overlays
 * live on video tracks too, but white-balancing a caption just discolours it,
 * so they are left alone.
 */
export function gradableClipIds(timeline: TimelineInfo): string[] {
  return timeline.tracks
    .filter((track) => track.type === 'video')
    .flatMap((track) => track.clips.filter((clip) => clip.mediaType !== 'text').map((clip) => clip.id))
}
