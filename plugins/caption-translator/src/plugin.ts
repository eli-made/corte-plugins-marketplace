/**
 * The sandboxed code bundle. Only the tool HANDLER lives here — the tool's
 * descriptor (and everything else about the plugin) ships in src/manifest.ts.
 * Meta and tool wiring derive from the manifest so they cannot drift; the
 * shared build script verifies parity against the built bundle.
 */
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'
import { translateText, type FetchLike } from './translate.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'so.corte.translate.captions': async (args) => {
    const targetLang = typeof args.targetLang === 'string' ? args.targetLang.trim() : ''
    if (!targetLang) return { text: 'targetLang is required, e.g. "es".', isError: true }
    const endpoint = typeof args.endpoint === 'string' && args.endpoint.trim() ? args.endpoint.trim() : undefined
    const dryRun = args.dryRun === true

    // `fetch` only exists in the sandbox worker when the user granted
    // net:fetch, so probe for it instead of assuming the permission stuck.
    const netFetch: FetchLike | undefined = typeof fetch === 'function' ? fetch : undefined

    const timeline = await ctx.editor.getTimeline()
    const textClips = timeline.tracks
      .flatMap((track) => track.clips)
      .flatMap((clip) => (clip.text && clip.text.trim() ? [{ id: clip.id, text: clip.text }] : []))

    let translated = 0
    let skipped = 0
    const details: {
      clipId: string
      original: string
      translated: string
      source: string
      applied: boolean
    }[] = []

    // Sequential: keeps the report in timeline order and avoids bursting a
    // self-hosted endpoint with one request per caption in parallel.
    for (const clip of textClips) {
      const result = await translateText(clip.text, { targetLang, endpoint, fetch: netFetch })
      let applied = false
      if (result.untranslated) {
        skipped++
      } else if (dryRun) {
        translated++
      } else {
        applied = await ctx.editor.setClipText(clip.id, result.text)
        if (applied) translated++
        else skipped++
      }
      details.push({
        clipId: clip.id,
        original: clip.text,
        translated: result.text,
        source: result.source,
        applied,
      })
    }

    await ctx.editor.showToast(
      textClips.length === 0
        ? 'Caption Translator: no text clips on this timeline'
        : `${dryRun ? 'Proposed' : 'Translated'} ${translated}/${textClips.length} caption${textClips.length === 1 ? '' : 's'} → ${targetLang}${skipped ? ` (${skipped} left as-is)` : ''}`,
      skipped && !translated ? 'error' : translated ? 'success' : 'info',
    )
    return { json: { targetLang, dryRun, translated, skipped, details } }
  },
})

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
