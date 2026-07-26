# Grade Sync

Give every clip in a cut the same look in one instruction. Pick a mood —
cinematic, warm, cool, vivid or matte — and Grade Sync applies a matched
exposure, contrast, saturation, white balance and vignette across your selection
or the whole timeline.

**Try it:** ask the editing agent *“grade everything cinematic”*.

| | |
| --- | --- |
| Contributions | 1 agent tool (`so.corte.gradesync.apply`) |
| Permissions | `read:timeline`, `write:effects`, `notify` |
| Price | Free |

## Why built-ins only

Every preset step targets one of Corte's own colour effects — `color.exposure`,
`color.contrast`, `color.saturation`, `color.temperature`, `stylize.vignette`.
Nothing is baked into a plugin-owned effect, so the grade shows up in the Adjust
panel, keyframes like any other, renders in export, and survives Grade Sync
being uninstalled.

Values are deliberately conservative: contrast lifts of 1.05–1.15, saturation
between 0.85 and 1.2, white balance between 5300 K and 7200 K. A mood should
read as a grade someone chose, not as a filter.

## Structure

- `src/manifest.ts` — the published contract (tool descriptor, permissions, copy); the `mood` enum is sourced from the preset table so the two cannot disagree
- `src/presets.ts` — the five presets plus the timeline filter, unit-tested in `presets.test.ts`
- `src/plugin.ts` — the sandbox bundle: wires the handler to the manifest-declared tool

With `scope: "all"` the handler grades every video and image clip on the
timeline; text overlays are skipped, since white-balancing a caption only
discolours it.

## Assets

`iconUrl` and `screenshots` point at `https://assets.corte.so/plugins/grade-sync/`
as placeholders. Plugin authors host their own assets; any https URL works.

Build with `npm run build` (from this directory or via the repo root) — emits
`dist/manifest.json` + `dist/plugin.js` and fails on any drift between them.
Publish both from **Settings → Developer → Plugins**.
