# Beat Match

Find the beats in a music track and cut to them: report the tempo, snap the
selected clips onto the nearest beat, or split them at every beat they contain.

**Try it:** select a few clips, then ask the editing agent *“split these on the
beat of the music track”*.

| | |
| --- | --- |
| Contributions | 2 agent tools (`so.corte.beatmatch.analyze`, `so.corte.beatmatch.snap`) |
| Permissions | `read:timeline`, `read:media`, `write:clips`, `notify` |
| Price | Free |

## How the detection works

The host decodes audio for the sandbox as mono PCM at ~8 kHz, which rules out
spectral analysis but is plenty for transients. `detectBeats` takes an RMS
envelope over ~1024-sample frames at 50 % overlap, keeps the positive
frame-to-frame flux, and accepts a peak when it clears **mean + 1.5·stddev of
the flux in a sliding ~1 s neighbourhood** — a local threshold, so a quiet
intro and a loud chorus are each judged on their own terms.

Two rules keep the output usable rather than merely correct: a frame must also
be at least 30 % louder than the one before it (steady material like room tone
wobbles by a few percent and would otherwise clear a threshold built from that
same small variance), and beats are spaced at least 0.25 s apart. Each accepted
frame is then refined against a fine-grained envelope inside it, so beats land
within about 8 ms instead of being quantized to the 128 ms frame grid.

The whole thing is one deterministic pass over the samples — the same audio
always yields the same beats, which matters when the result becomes edits.

## Structure

- `src/manifest.ts` — the published contract (tool descriptors, permissions, copy)
- `src/beats.ts` — pure detection and frame math, unit-tested in `beats.test.ts`
- `src/plugin.ts` — the sandbox bundle: wires handlers to the manifest-declared tools

Manifest asset URLs (icon, screenshots, media) are served from this repo's `assets/` directory via raw.githubusercontent.com — generated in-house. Third-party authors can use any https URL.

Build with `npm run build` (from this directory or via the repo root) —
emits `dist/manifest.json` + `dist/plugin.js` and fails on any drift between
them. Publish both from **Settings → Developer → Plugins**.
