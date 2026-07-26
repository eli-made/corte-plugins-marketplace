/**
 * Shared plugin build. Run from a plugin directory (each plugin's `npm run
 * build` does). Produces the two publish artifacts from one source of truth:
 *
 *   dist/manifest.json  — generated from src/manifest.ts
 *   dist/plugin.js      — self-contained ES-module bundle from src/plugin.ts
 *                         (only when the plugin has one; data-only plugins
 *                         ship just the manifest)
 *
 * then verifies parity and refuses to build out-of-sync artifacts:
 *   - a manifest that declares tools MUST have a bundle, and every declared
 *     tool must have a handler registered by the built bundle (and vice versa)
 *   - bundle meta must match the manifest (id, version)
 *   - every contribution id must be namespaced under the plugin id
 */
import { build } from 'esbuild'
import { writeFile, rm, access } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const out = (p) => path.join(root, 'dist', p)
const exists = (p) => access(p).then(() => true, () => false)

const fail = (msg) => {
  console.error(`✗ ${msg}`)
  process.exitCode = 1
}

// 1. The manifest, evaluated from TS and emitted as JSON.
const manifestTmp = out('.manifest.build.mjs')
await build({ entryPoints: [path.join(root, 'src/manifest.ts')], bundle: true, format: 'esm', outfile: manifestTmp })
const { manifest } = await import(pathToFileURL(manifestTmp))
await rm(manifestTmp)
await writeFile(out('manifest.json'), JSON.stringify(manifest, null, 2) + '\n')

// 2. The bundle, when the plugin ships code.
const hasBundle = await exists(path.join(root, 'src/plugin.ts'))
const declared = (manifest.contributions.tools ?? []).map((t) => t.name)
if (declared.length > 0 && !hasBundle) fail('manifest declares tools but src/plugin.ts is missing')

if (hasBundle) {
  await build({ entryPoints: [path.join(root, 'src/plugin.ts')], bundle: true, format: 'esm', outfile: out('plugin.js') })

  // 3. Parity: activate the BUILT bundle against a stub context and compare.
  const { default: plugin } = await import(pathToFileURL(out('plugin.js')))
  const registered = []
  plugin.activate({
    meta: plugin.meta,
    editor: {}, media: {},
    tools: { register: ({ name }) => registered.push(name) },
  })
  for (const name of declared) {
    if (!registered.includes(name)) fail(`manifest declares tool "${name}" but the bundle registers no handler for it`)
  }
  for (const name of registered) {
    if (!declared.includes(name)) fail(`bundle registers handler "${name}" not declared in the manifest (it would never be advertised)`)
  }
  if (plugin.meta.id !== manifest.id) fail(`meta.id "${plugin.meta.id}" ≠ manifest.id "${manifest.id}"`)
  if (plugin.meta.version !== manifest.pluginVersion) fail(`meta.version "${plugin.meta.version}" ≠ manifest.pluginVersion "${manifest.pluginVersion}"`)
}

// 4. Namespacing — every contribution id lives under the plugin id.
const ids = [
  ...(manifest.contributions.tools ?? []).map((t) => t.name),
  ...(manifest.contributions.templates ?? []).map((t) => t.id),
  ...(manifest.contributions.library ?? []).map((a) => a.id),
  ...(manifest.contributions.models ?? []).map((m) => m.id),
  ...(manifest.contributions.effects ?? []).map((e) => e.type),
]
for (const id of ids) {
  if (!id.startsWith(`${manifest.id}.`)) fail(`contribution id "${id}" is not namespaced under "${manifest.id}."`)
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`✓ ${manifest.id} v${manifest.pluginVersion} → dist/manifest.json${hasBundle ? ' + dist/plugin.js' : ' (data-only)'} — parity verified`)
