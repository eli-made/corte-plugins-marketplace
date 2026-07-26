/**
 * The sandboxed code bundle. Only the tool HANDLER lives here — the tool's
 * descriptor (and everything else about the plugin) ships in src/manifest.ts.
 * Meta and tool wiring derive from the manifest so they cannot drift; the
 * shared build script verifies parity against the built bundle.
 */
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'
import { gradableClipIds, isMood, MOOD_PRESETS } from './presets.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'so.corte.gradesync.apply': async (args) => {
    if (!isMood(args.mood)) {
      return { text: `Unknown mood "${String(args.mood)}". Pick one of: ${Object.keys(MOOD_PRESETS).join(', ')}.`, isError: true }
    }
    const mood = args.mood
    const scope = args.scope === 'all' ? 'all' : 'selected'

    const clipIds =
      scope === 'all' ? gradableClipIds(await ctx.editor.getTimeline()) : await ctx.editor.getSelectedClipIds()

    if (clipIds.length === 0) {
      const why = scope === 'all' ? 'The timeline has no video clips to grade.' : 'Select the clips to grade first.'
      await ctx.editor.showToast(why, 'error')
      return { text: why, isError: true }
    }

    // One call per preset step rather than per clip: applyEffect takes a clip
    // list, and batching keeps the grade a single undo step per effect.
    for (const step of MOOD_PRESETS[mood]) {
      await ctx.editor.applyEffect(clipIds, { type: step.type, params: step.params })
    }

    await ctx.editor.showToast(
      `Graded ${clipIds.length} clip${clipIds.length === 1 ? '' : 's'} — ${mood}`,
      'success',
    )
    return { json: { clips: clipIds.length, mood } }
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
