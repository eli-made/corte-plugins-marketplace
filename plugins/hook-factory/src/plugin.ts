/**
 * The sandboxed code bundle. Only the tool HANDLER lives here — the tool's
 * descriptor (and the eight templates) ship in src/manifest.ts. Meta and tool
 * wiring derive from the manifest so they cannot drift; the shared build script
 * verifies parity against the built bundle.
 */
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'
import { findHook, HOOK_SLUGS } from './hooks.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'so.corte.hooks.insert': async (args) => {
    const hook = findHook(args.archetype)
    if (!hook) {
      return { text: `Unknown archetype "${String(args.archetype)}". Pick one of: ${HOOK_SLUGS.join(', ')}.`, isError: true }
    }

    // The overlays already carry their timing relative to the start of the
    // video, so they go in at their own frames rather than being offset.
    const added: string[] = []
    for (const overlay of hook.overlays) {
      added.push(...(await ctx.editor.addText(overlay)))
    }

    await ctx.editor.showToast(`Added the ${hook.name} hook — ${added.length} overlays`, 'success')
    return { json: { added } }
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
