/**
 * The pure audit logic — separated from the plugin wiring so it can be unit
 * tested without a sandbox. Takes the host's TimelineInfo shape, returns
 * structured findings the agent can relay (or act on).
 */
import type { TimelineInfo } from '@corte/plugin-types'

export interface PreflightFinding {
  severity: 'error' | 'warning'
  kind: 'gap' | 'flash-frame' | 'no-audio' | 'over-duration'
  message: string
}

export const PLATFORM_LIMITS_SECONDS: Record<string, number> = {
  tiktok: 60,
  reels: 90,
  shorts: 60,
}

/** Clips shorter than this read as an accidental flash frame. */
const FLASH_FRAME_SECONDS = 0.25

export function auditTimeline(t: TimelineInfo, opts: { maxSeconds?: number } = {}): PreflightFinding[] {
  const findings: PreflightFinding[] = []

  for (const [index, track] of t.tracks.entries()) {
    const clips = [...track.clips].sort((a, b) => a.startFrame - b.startFrame)
    for (let i = 1; i < clips.length; i++) {
      const prevEnd = clips[i - 1].startFrame + clips[i - 1].durationFrames
      const gap = clips[i].startFrame - prevEnd
      if (gap > 0) {
        findings.push({
          severity: 'warning',
          kind: 'gap',
          message: `Track ${index + 1} has a ${(gap / t.fps).toFixed(2)}s gap at ${frameToTc(prevEnd, t.fps)} — it will render as black.`,
        })
      }
    }
    for (const clip of clips) {
      if (clip.durationFrames < FLASH_FRAME_SECONDS * t.fps && clip.mediaType !== 'text') {
        findings.push({
          severity: 'warning',
          kind: 'flash-frame',
          message: `A ${clip.durationFrames}-frame ${clip.mediaType} clip at ${frameToTc(clip.startFrame, t.fps)} on track ${index + 1} may read as a flash frame.`,
        })
      }
    }
  }

  const hasAudio = t.tracks.some(
    (track) => track.type === 'audio' && track.clips.length > 0,
  ) || t.tracks.some((track) => track.clips.some((c) => c.mediaType === 'audio'))
  if (!hasAudio && t.tracks.some((track) => track.clips.length > 0)) {
    findings.push({
      severity: 'warning',
      kind: 'no-audio',
      message: 'The timeline has no audio clips — exports will be silent.',
    })
  }

  if (opts.maxSeconds !== undefined) {
    const seconds = t.durationFrames / t.fps
    if (seconds > opts.maxSeconds) {
      findings.push({
        severity: 'error',
        kind: 'over-duration',
        message: `Timeline runs ${seconds.toFixed(1)}s — ${(seconds - opts.maxSeconds).toFixed(1)}s over the ${opts.maxSeconds}s limit.`,
      })
    }
  }

  return findings
}

function frameToTc(frame: number, fps: number): string {
  const s = frame / fps
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  const ff = String(Math.round(frame % fps)).padStart(2, '0')
  return `${mm}:${ss}:${ff}`
}
