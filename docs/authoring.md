# Authoring a Corte plugin

This is the end-to-end walk-through. The short version: write a typed
manifest, optionally write tool handlers, build, publish. Copy the plugin in
this repo closest to what you're making.

## 1. Decide what you're shipping

| You want to add… | Contribution | Needs code? |
| --- | --- | --- |
| Shader effects | `contributions.effects` — GLSL + declarative uniforms | No |
| Project templates | `contributions.templates` | No |
| Stock media | `contributions.library` (https URLs you host) | No |
| Model catalog cards | `contributions.models` | No |
| Abilities for the AI editing agent | `contributions.tools` | **Yes** — a sandbox bundle |

Data-only plugins are a manifest and nothing else. Tools are descriptors in
the manifest plus handlers in a bundle.

## 2. The manifest (`src/manifest.ts`)

```ts
import { defineManifest } from '@corte/plugin-types'

export const manifest = defineManifest({
  version: 1,
  id: 'com.you.thing',        // reverse-DNS, globally unique, yours forever
  name: 'Your Thing',
  pluginVersion: '1.0.0',     // semver; every publish is a new immutable version
  description: 'One or two sentences for the marketplace card.',
  about: 'Longer copy for the detail page.\n\nBlank lines separate paragraphs.',
  tags: ['color', 'social'],
  iconUrl: 'https://your.cdn/icon.png',        // optional, https
  screenshots: ['https://your.cdn/shot1.png'], // optional, https, max 6
  permissions: ['read:timeline', 'notify'],    // ONLY what you use — users see this
  contributions: { /* … */ },
})
```

Rules the platform enforces at publish: every contribution id (template id,
effect type, tool name, …) must start with `<your-plugin-id>.`; versions must
be new; a manifest with tools must ship a bundle.

### Permissions

| Permission | Grants |
| --- | --- |
| `read:timeline` | `getTimeline()`, `getSelectedClipIds()` — includes text-clip content |
| `read:media` | `getBlob()`, `getAudioSamples()` |
| `write:clips` | `addText()`, `setClipText()`, `moveClip()`, `splitClip()` |
| `write:effects` | `applyEffect()` |
| `notify` | `showToast()` |
| `net:fetch` | keeps `fetch`/`XMLHttpRequest`/`WebSocket` available in your worker; without it they throw |

Request the minimum. The permission list *is* the install consent screen.

### Shader effects

Single-pass GLSL ES 300 fragment shaders. The host provides the `vUV` varying
(note the capitalization) and binds the source frame to `uTex`; you declare
which uniform gets which parameter:

```ts
{
  type: 'com.you.thing.vignette',
  displayName: 'Vignette',
  category: 'stylize',
  params: [{ key: 'amount', label: 'Amount', min: 0, max: 1, default: 0.5 }],
  fragmentShader: `#version 300 es
precision highp float;
in vec2 vUV;
out vec4 fragColor;
uniform sampler2D uTex;
uniform float uAmount;
void main() {
  vec4 c = texture(uTex, vUV);
  float d = distance(vUV, vec2(0.5));
  fragColor = vec4(c.rgb * mix(1.0, smoothstep(0.9, 0.3, d), uAmount), c.a);
}`,
  uniforms: { uAmount: 'amount' },
}
```

Parameters are keyframable by users automatically. No imperative GL access —
uniform maps are the only binding.

## 3. The bundle (`src/plugin.ts`) — tools only

Your bundle runs in a **sandboxed worker**: no DOM, no app internals, network
stripped unless you asked for `net:fetch`. Every editor call is an async
message the host answers after checking permissions.

```ts
import { defineSandboxPlugin, type SandboxPluginContext, type ToolResult } from '@corte/plugin-types'
import { manifest } from './manifest.ts'

type Handler = (args: Record<string, unknown>) => ToolResult | Promise<ToolResult>

const handlers = (ctx: SandboxPluginContext): Partial<Record<string, Handler>> => ({
  'com.you.thing.do_it': async (args) => {
    const t = await ctx.editor.getTimeline()
    return { json: { tracks: t.tracks.length } }
  },
})

export default defineSandboxPlugin({
  meta: { id: manifest.id, name: manifest.name, version: manifest.pluginVersion, permissions: manifest.permissions },
  activate(ctx) {
    const byName = handlers(ctx)
    for (const tool of manifest.contributions.tools ?? []) {
      const handler = byName[tool.name]
      if (handler) ctx.tools.register({ name: tool.name, handler })
    }
  },
})
```

Only manifest-declared tools are ever advertised to the agent — a handler the
manifest doesn't declare is inert. Keep real logic in separate pure modules
and unit-test them (see any plugin's `*.test.ts` here).

## 4. Build

```sh
npm run build   # from the plugin directory
```

emits `dist/manifest.json` + `dist/plugin.js` and **fails** on drift: declared
tool without a handler, handler without a declaration, meta ≠ manifest, or an
un-namespaced contribution id. What builds is publishable.

## 5. Publish

From this repo: `CORTE_API_KEY=corte_sk_… npm run publish` (see the root
README) — it version-diffs against the marketplace and publishes only what
changed. Or manually: **Settings → Developer → Plugins → Publish a plugin…** —
paste `dist/manifest.json`, attach `dist/plugin.js`, set a price (0 = free;
authors earn 70% of every sale as credits, which never expire). Manage versions,
installs, earnings, and per-tool telemetry (runs, errors, latency) from that
plugin's detail page. Users install from **Settings → Marketplace**, pinned to
the version they installed until they accept an update — permission changes
always re-prompt.
