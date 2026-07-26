# Pre-flight Checker

Audit your timeline before export: gaps between clips, flash-frame clips,
missing audio, and platform duration limits (TikTok / Reels / Shorts or a
custom cap). Read-only — it reports, it never edits.

**Try it:** ask the editing agent *“run a pre-flight check for reels”*.

| | |
| --- | --- |
| Contributions | 1 agent tool (`so.corte.preflight.check`) |
| Permissions | `read:timeline`, `notify` |
| Price | Free |

## Structure

- `src/manifest.ts` — the published contract (tool descriptor, permissions, copy)
- `src/audit.ts` — pure audit logic, unit-tested in `audit.test.ts`
- `src/plugin.ts` — the sandbox bundle: wires the handler to the manifest-declared tool

Build with `npm run build` (from this directory or via the repo root) —
emits `dist/manifest.json` + `dist/plugin.js` and fails on any drift between
them. Publish both from **Settings → Developer → Plugins**.
