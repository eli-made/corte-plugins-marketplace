/**
 * The sandboxed code bundle. Only the tool HANDLER lives here — its descriptor,
 * the templates, and the library assets ship in src/manifest.ts. Meta and tool
 * wiring derive from the manifest so they cannot drift; the shared build script
 * verifies parity against the built bundle.
 */
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'
import { buildLowerThird } from './lowerThird.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

const optionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined
const optionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'so.corte.rekit.lower_third': async (args) => {
    const address = optionalString(args.address)
    if (!address) return { text: 'address is required, e.g. "18 Calle Verde".', isError: true }

    // The timeline owns the frame rate, so the block's timing is computed
    // against it rather than assuming the templates' 30 fps.
    const timeline = await ctx.editor.getTimeline()
    const lines = buildLowerThird(
      {
        address,
        specs: optionalString(args.specs),
        price: optionalString(args.price),
        atSeconds: optionalNumber(args.atSeconds),
        durationSeconds: optionalNumber(args.durationSeconds),
      },
      timeline.fps,
    )

    let added = 0
    for (const line of lines) {
      const created = await ctx.editor.addText({
        content: line.content,
        startFrame: line.startFrame,
        endFrame: line.endFrame,
      })
      added += created.length
    }

    await ctx.editor.showToast(
      added ? `Lower third added (${added} line${added === 1 ? '' : 's'})` : 'Lower third: nothing was added',
      added ? 'success' : 'error',
    )
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
