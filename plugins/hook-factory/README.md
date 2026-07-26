# Hook Factory

Eight opening hooks that stop the scroll — The Question, The Countdown, The Hot
Take, The Mistake, The Reveal, The Before / After, The Listicle, The Call-Out.
Each is two or three timed overlays landing inside the first three seconds,
available both as a vertical template and as something the editing agent can
drop onto the cut you already have.

**Try it:** ask the editing agent *“add the countdown hook to this video”*.

| | |
| --- | --- |
| Contributions | 8 templates (1080×1920 @ 30) + 1 agent tool (`so.corte.hooks.insert`) |
| Permissions | `write:clips`, `notify` |
| Price | Free |

The copy that ships is placeholder on purpose. *“3 things I wish I knew sooner”*
is the shape of the hook; your version of it is the actual hook. Once inserted,
every overlay is an ordinary text clip — restyle, retime and move it freely.

## Structure

- `src/hooks.ts` — the eight archetypes, unit-tested in `hooks.test.ts`
- `src/manifest.ts` — the published contract; templates and the tool's `archetype` enum are both generated from `hooks.ts`
- `src/plugin.ts` — the sandbox bundle: wires the handler to the manifest-declared tool

Templates and the insert tool are two faces of the same eight hooks. Defining
them once is what stops "The Countdown" the template and "The Countdown" the
tool from drifting into two different edits; the tests assert that generation
so a later hand-edit to either side is caught.

## Assets

`iconUrl`, `screenshots` and template `thumbnailUrl`s point at
`https://assets.corte.so/plugins/hook-factory/` as placeholders. Plugin authors
host their own assets; any https URL works.

Build with `npm run build` (from this directory or via the repo root) — emits
`dist/manifest.json` + `dist/plugin.js` and fails on any drift between them.
Publish both from **Settings → Developer → Plugins**.
