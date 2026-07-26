/**
 * The sandboxed code bundle. Only the tool HANDLER lives here — the tool's
 * descriptor (and everything else about the plugin) ships in src/manifest.ts.
 * Meta and tool wiring derive from the manifest so they cannot drift; the
 * shared build script verifies parity against the built bundle.
 */
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'
import { auditTimeline, PLATFORM_LIMITS_SECONDS } from './audit.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'so.corte.preflight.check': async (args) => {
    const platform = typeof args.platform === 'string' ? args.platform : 'none'
    const maxSeconds =
      typeof args.maxSeconds === 'number' ? args.maxSeconds : PLATFORM_LIMITS_SECONDS[platform]

    const timeline = await ctx.editor.getTimeline()
    const findings = auditTimeline(timeline, { maxSeconds })

    const errors = findings.filter((f) => f.severity === 'error').length
    await ctx.editor.showToast(
      findings.length === 0
        ? 'Pre-flight: all clear ✓'
        : `Pre-flight: ${findings.length} finding${findings.length === 1 ? '' : 's'}${errors ? ` (${errors} blocking)` : ''}`,
      errors ? 'error' : findings.length ? 'info' : 'success',
    )
    return { json: { timeline: timeline.name, duration: timeline.duration, findings } }
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
