import { describe, expect, it } from 'vitest'
import type { TimelineInfo } from '@corte/plugin-types'
import { auditTimeline } from './audit.ts'

const timeline = (over: Partial<TimelineInfo> = {}): TimelineInfo => ({
  id: 't1', name: 'T', fps: 30, width: 1920, height: 1080,
  durationFrames: 300, duration: '00:00:10:00',
  tracks: [
    {
      type: 'video',
      clips: [
        { id: 'a', mediaType: 'video', startFrame: 0, durationFrames: 90 },
        { id: 'b', mediaType: 'video', startFrame: 120, durationFrames: 180 }, // 1s gap after `a`
      ],
    },
    { type: 'audio', clips: [{ id: 'm', mediaType: 'audio', startFrame: 0, durationFrames: 300 }] },
  ],
  ...over,
})

describe('auditTimeline', () => {
  it('finds gaps between clips on a track', () => {
    const findings = auditTimeline(timeline())
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ kind: 'gap', severity: 'warning' })
    expect(findings[0].message).toContain('1.00s gap')
  })

  it('flags flash-frame clips but not short text overlays', () => {
    const t = timeline({
      tracks: [{
        type: 'video',
        clips: [
          { id: 'a', mediaType: 'video', startFrame: 0, durationFrames: 3 },
          { id: 'txt', mediaType: 'text', startFrame: 0, durationFrames: 3 },
        ],
      }],
    })
    const kinds = auditTimeline(t).map((f) => f.kind)
    expect(kinds.filter((k) => k === 'flash-frame')).toHaveLength(1)
  })

  it('warns when a non-empty timeline has no audio', () => {
    const t = timeline({ tracks: [{ type: 'video', clips: [{ id: 'a', mediaType: 'video', startFrame: 0, durationFrames: 300 }] }] })
    expect(auditTimeline(t).map((f) => f.kind)).toContain('no-audio')
  })

  it('reports duration overage against a limit as blocking', () => {
    const findings = auditTimeline(timeline(), { maxSeconds: 6 })
    const over = findings.find((f) => f.kind === 'over-duration')
    expect(over?.severity).toBe('error')
    expect(over?.message).toContain('4.0s over')
  })

  it('is silent on a clean timeline', () => {
    const t = timeline({
      tracks: [
        { type: 'video', clips: [{ id: 'a', mediaType: 'video', startFrame: 0, durationFrames: 300 }] },
        { type: 'audio', clips: [{ id: 'm', mediaType: 'audio', startFrame: 0, durationFrames: 300 }] },
      ],
    })
    expect(auditTimeline(t)).toHaveLength(0)
  })
})
