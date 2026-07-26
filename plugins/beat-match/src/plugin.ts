/**
 * The sandboxed code bundle. Only the tool HANDLERS live here — their
 * descriptors (and everything else about the plugin) ship in src/manifest.ts.
 * Meta and tool wiring derive from the manifest so they cannot drift; the
 * shared build script verifies parity against the built bundle.
 */
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'
import { detectBeats, estimateBpm, nearestFrame } from './beats.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

/** Enough beats for the agent to reason about without flooding its context. */
const MAX_REPORTED_BEATS = 200

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'so.corte.beatmatch.analyze': async (args) => {
    const assetId = typeof args.assetId === 'string' ? args.assetId : ''
    if (!assetId) return { text: 'assetId is required.', isError: true }
    const targetHz = typeof args.targetHz === 'number' ? args.targetHz : undefined

    const audio = await ctx.media.getAudioSamples(assetId, targetHz ? { targetHz } : undefined)
    if (!audio) return { text: `No decodable audio on asset ${assetId}.`, isError: true }

    const beats = detectBeats(audio.samples, audio.sampleRate)
    await ctx.editor.showToast(
      beats.length ? `Beat Match: ${beats.length} beats found` : 'Beat Match: no beats found',
      beats.length ? 'success' : 'info',
    )
    return {
      json: {
        bpmEstimate: estimateBpm(beats),
        count: beats.length,
        beats: beats.slice(0, MAX_REPORTED_BEATS).map(round3),
      },
    }
  },

  'so.corte.beatmatch.snap': async (args) => {
    const assetId = typeof args.assetId === 'string' ? args.assetId : ''
    if (!assetId) return { text: 'assetId is required.', isError: true }
    const mode = args.mode === 'split' ? 'split' : 'move'

    const audio = await ctx.media.getAudioSamples(assetId)
    if (!audio) return { text: `No decodable audio on asset ${assetId}.`, isError: true }

    const [timeline, selectedIds] = await Promise.all([
      ctx.editor.getTimeline(),
      ctx.editor.getSelectedClipIds(),
    ])
    const beatFrames = detectBeats(audio.samples, audio.sampleRate).map((s) => Math.round(s * timeline.fps))
    const byId = new Map(timeline.tracks.flatMap((track) => track.clips).map((clip) => [clip.id, clip]))
    const selected = selectedIds.flatMap((id) => {
      const clip = byId.get(id)
      return clip ? [clip] : []
    })

    let affected = 0
    if (beatFrames.length && selected.length) {
      for (const clip of selected) {
        if (mode === 'move') {
          const frame = nearestFrame(beatFrames, clip.startFrame)
          // A clip already sitting on a beat needs no edit — and moving it
          // would still cost the user an undo step.
          if (frame === undefined || frame === clip.startFrame) continue
          if (await ctx.editor.moveClip(clip.id, { frame })) affected++
        } else {
          const inside = beatFrames
            .filter((frame) => frame > clip.startFrame && frame < clip.startFrame + clip.durationFrames)
            // Back to front: each split keeps the head under the original clip
            // id, so the frames still to cut stay inside the clip we address.
            .sort((a, b) => b - a)
          for (const frame of inside) {
            if (await ctx.editor.splitClip(clip.id, frame)) affected++
          }
        }
      }
    }

    await ctx.editor.showToast(
      selected.length === 0
        ? 'Beat Match: select the clips to snap first'
        : `Beat Match: ${mode === 'move' ? 'moved' : 'split'} ${affected} clip${affected === 1 ? '' : 's'} across ${beatFrames.length} beats`,
      selected.length === 0 ? 'error' : affected ? 'success' : 'info',
    )
    return { json: { mode, beats: beatFrames.length, affected } }
  },
})

const round3 = (seconds: number): number => Math.round(seconds * 1000) / 1000

export default defineSandboxPlugin({
  meta: {
    id: manifest.id,
    name: manifest.name,
    version: manifest.pluginVersion,
    description: manifest.description,
    permissions: manifest.permissions,
  },
  activate(ctx) {
    const byName = handlers(ctx)
    for (const tool of manifest.contributions.tools ?? []) {
      const handler = byName[tool.name]
      if (handler) ctx.tools.register({ name: tool.name, handler })
    }
  },
})
