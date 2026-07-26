#!/usr/bin/env node
/**
 * Publish every plugin whose local version is ahead of — or absent from — the
 * Corte marketplace. Safe to run repeatedly: up-to-date plugins are skipped,
 * and the marketplace's immutable-version rule makes double publishes 409.
 *
 *   CORTE_API_KEY=corte_sk_…  npm run publish            # all plugins
 *   CORTE_API_KEY=corte_sk_…  npm run publish -- beat-match film-lab
 *   CORTE_API_URL=http://localhost:8787  …               # target a dev server
 *
 * Per plugin it: rebuilds (drift-checking), diffs dist/manifest.json's
 * pluginVersion against GET /v1/plugins/:id, uploads dist/plugin.js when the
 * manifest declares tools (ticket → PUT → commit), then POST /v1/plugins.
 * Price comes from the plugin package.json's `corte.priceCredits` (omitted =
 * keep the marketplace's current price; 0 on first publish).
 */
import { readdir, readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const API = (process.env.CORTE_API_URL ?? 'https://api.corte.so').replace(/\/+$/, '')
const KEY = process.env.CORTE_API_KEY
if (!KEY) {
  console.error('Set CORTE_API_KEY to a Corte API key (Settings → Developer → API).')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDir = path.join(root, 'plugins')
const buildScript = path.join(root, 'scripts', 'build-plugin.mjs')
const filters = process.argv.slice(2)

async function api(method, p, body) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { authorization: `Bearer ${KEY}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

/** Numeric semver compare; positive when a > b. */
function semverCmp(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  return 0
}

/** Upload the bundle through the ticket → PUT → commit flow; returns storageId. */
async function uploadBundle(bytes, filename) {
  const ticket = await api('POST', '/v1/uploads/ticket', {
    contentType: 'text/javascript',
    sizeBytes: bytes.byteLength,
    filename,
  })
  if (ticket.status !== 200) throw new Error(`upload ticket failed (${ticket.status}): ${ticket.json?.error?.message ?? ''}`)
  const url = ticket.json.uploadUrl.startsWith('http') ? ticket.json.uploadUrl : `${API}${ticket.json.uploadUrl}`
  const put = await fetch(url, { method: 'PUT', body: bytes, headers: { 'content-type': 'text/javascript' } })
  if (!put.ok) throw new Error(`bundle PUT failed (${put.status})`)
  const commit = await api('POST', `/v1/uploads/${ticket.json.storageId}/commit`, {})
  if (commit.status !== 200) throw new Error(`bundle commit failed (${commit.status})`)
  return ticket.json.storageId
}

const dirs = (await readdir(pluginsDir, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter((name) => filters.length === 0 || filters.includes(name))
  .sort()

if (dirs.length === 0) {
  console.error(filters.length ? `No plugins match: ${filters.join(', ')}` : 'No plugins found.')
  process.exit(1)
}

const results = []
for (const dir of dirs) {
  const cwd = path.join(pluginsDir, dir)
  try {
    // Rebuild so what we publish is exactly what the source says (the build
    // fails on manifest↔bundle drift, so a green build is publishable).
    const built = spawnSync(process.execPath, [buildScript], { cwd, stdio: 'pipe' })
    if (built.status !== 0) throw new Error(`build failed:\n${built.stderr}${built.stdout}`)

    const manifest = JSON.parse(await readFile(path.join(cwd, 'dist/manifest.json'), 'utf8'))
    const pkg = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'))
    const priceCredits = pkg.corte?.priceCredits

    const remote = await api('GET', `/v1/plugins/${encodeURIComponent(manifest.id)}`)
    if (remote.status === 200) {
      const published = remote.json.plugin.latestVersion
      const cmp = semverCmp(manifest.pluginVersion, published)
      if (cmp === 0) {
        results.push({ dir, id: manifest.id, action: 'up-to-date', version: published })
        continue
      }
      if (cmp < 0) {
        // Publishing would make the OLDER version latest — never what a batch
        // publisher should do silently. Pull, or bump past the marketplace.
        results.push({ dir, id: manifest.id, action: 'behind', version: `local ${manifest.pluginVersion} < published ${published}` })
        continue
      }
    } else if (remote.status !== 404) {
      throw new Error(`GET /v1/plugins/${manifest.id} → ${remote.status}`)
    }

    let bundleStorageId
    if ((manifest.contributions.tools ?? []).length > 0) {
      const bytes = await readFile(path.join(cwd, 'dist/plugin.js'))
      bundleStorageId = await uploadBundle(bytes, `${manifest.id}-${manifest.pluginVersion}.js`)
    }

    const published = await api('POST', '/v1/plugins', { manifest, priceCredits, bundleStorageId })
    if (published.status !== 200) {
      throw new Error(`publish → ${published.status}: ${published.json?.error?.message ?? 'unknown error'}`)
    }
    results.push({
      dir, id: manifest.id,
      action: remote.status === 404 ? 'published (new)' : 'published (update)',
      version: manifest.pluginVersion,
    })
  } catch (err) {
    results.push({ dir, action: 'FAILED', version: err instanceof Error ? err.message.split('\n')[0] : String(err) })
  }
}

const width = Math.max(...results.map((r) => r.dir.length))
for (const r of results) {
  console.log(`${r.dir.padEnd(width)}  ${r.action.padEnd(19)} ${r.version ?? ''}`)
}
const failed = results.filter((r) => r.action === 'FAILED')
const behind = results.filter((r) => r.action === 'behind')
if (behind.length) console.log('\n"behind" plugins were NOT published — bump pluginVersion past the marketplace to release.')
if (failed.length) {
  console.error(`\n${failed.length} plugin(s) failed.`)
  process.exit(1)
}
