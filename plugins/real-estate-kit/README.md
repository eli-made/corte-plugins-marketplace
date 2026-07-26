# Real Estate Kit

Listing videos without the setup: three property templates (9:16 Listing Reel,
16:9 Property Tour, 1:1 Open House), eight stock clips the templates fill
themselves with, and a one-call listing lower third.

**Try it:** start from the *Listing Reel* template, then ask the editing agent
*“add a lower third for 18 Calle Verde, 4 bd · 3 ba · 2,400 sqft, $1,250,000”*.

| | |
| --- | --- |
| Contributions | 3 templates, 8 library clips, 1 agent tool (`so.corte.rekit.lower_third`) |
| Permissions | `read:timeline`, `write:clips`, `notify` |
| Price | Free |

## How the templates fill themselves

Template slots don't name a specific clip — they carry a query
(`{ kind: 'video', tags: ['kitchen'], vertical: 'real-estate' }`), and the host
resolves it against the library. The eight bundled clips are tagged to match
(`exterior`, `aerial`, `interior`, `kitchen`, `pool`, `dusk`, …), so a new
project cuts together immediately and each slot can be swapped for the real
listing's footage as it lands, without touching the timing.

The lower third is computed against the *timeline's* fps rather than the
templates' 30, so it stays correctly timed if you dropped the kit into a 24 or
60 fps edit. `addText` carries content and timing but no styling, so the
address line is upper-cased to read as the headline above the specs and price.

## Structure

- `src/manifest.ts` — the published contract (templates, library assets, tool descriptor, copy)
- `src/lowerThird.ts` — pure line building and frame math, unit-tested in `lowerThird.test.ts`
- `src/plugin.ts` — the sandbox bundle: wires the handler to the manifest-declared tool

Every media URL in the manifest (`iconUrl`, `screenshots`, clip `url` /
Manifest asset URLs (icon, screenshots, media) are served from the plugin's own `assets/` directory via raw.githubusercontent.com — generated in-house. Third-party authors can use any https URL.

Build with `npm run build` (from this directory or via the repo root) —
emits `dist/manifest.json` + `dist/plugin.js` and fails on any drift between
them. Publish both from **Settings → Developer → Plugins**.
