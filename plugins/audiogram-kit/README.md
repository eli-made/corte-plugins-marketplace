# Audiogram Kit

Turn a podcast clip into something watchable. Six audiogram layouts — three
square for the feed, three vertical for Shorts and Reels — with pull-quote,
episode-title and @handle text already positioned and timed, plus four music
beds the layouts pull in automatically.

**Try it:** start a project from **Vertical — Pull Quote**, drop your episode
audio in, and replace the placeholder quote.

| | |
| --- | --- |
| Contributions | 6 templates (3 × 1080×1080, 3 × 1080×1920 @ 30) + 4 library audio beds |
| Permissions | None — data-only, no code runs |
| Price | Free |

Each template runs 30 seconds and requests its music bed by **tag** rather than
by asset id, so swapping Warm Keys for Low Strings does not touch the layout.
The beds are a minute long and mixed to sit under speech.

## Structure

- `src/manifest.ts` — the whole plugin: template layouts, bed slots, and the four library assets

There is no `src/plugin.ts`. Templates and library assets are pure data, so
nothing about Audiogram Kit executes in the sandbox and it requests no
permissions.

## Assets

`iconUrl`, `screenshots`, template `thumbnailUrl`s and the four bed `url`s point
at `https://assets.corte.so/plugins/audiogram-kit/` as placeholders. Plugin
authors host their own assets; any https URL works — the audio files must be
reachable for the library contributions to resolve.

Build with `npm run build` (from this directory or via the repo root) — emits
`dist/manifest.json` and fails if any contribution id is not namespaced under
the plugin id. Publish from **Settings → Developer → Plugins**.
