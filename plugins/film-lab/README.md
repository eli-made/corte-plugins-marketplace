# Film Lab

Ten cinematic looks as real-time shader effects — teal & orange, bleach bypass,
halation glow, VHS wear, day-for-night, film grain, cross-process, faded matte,
cool noir, golden hour. Each has an Amount slider that blends back to your
source, so the defaults are a starting point rather than a maximum.

**Try it:** drop **Golden Hour** on a clip, then stack **Halation Glow** over it
and raise Threshold until only the practicals flare.

| | |
| --- | --- |
| Contributions | 10 shader effects (`so.corte.filmlab.*`) |
| Permissions | None — data-only, no code runs |
| Price | Free |

## Structure

- `src/manifest.ts` — the published contract (effect descriptors, params, uniform bindings, copy)
- `src/shaders.ts` — the GLSL for all ten looks, kept out of the manifest for readability
- `src/shaders.test.ts` — static parity: every declared uniform exists in its shader, every param is bound

There is no `src/plugin.ts`. Effects are pure data, so nothing about Film Lab
executes in the sandbox and it requests no permissions.

## Writing looks of your own

Each shader is single-pass GLSL ES 300. The host's vertex stage provides the
`vUV` varying (note the caps) and binds the source frame to `uTex`; write to
`out vec4 fragColor`. Uniforms are bound declaratively through the manifest's
`uniforms` map (GLSL uniform name → param key) and are **floats only** — there
is no time or resolution uniform, which is why radii here are expressed as a
percentage of the frame and why the grain is frame-stable rather than crawling.

## Assets

`iconUrl` and `screenshots` point at `https://assets.corte.so/plugins/film-lab/`
as placeholders. Plugin authors host their own assets; any https URL works.

Build with `npm run build` (from this directory or via the repo root) — emits
`dist/manifest.json` and fails if any contribution id is not namespaced under
the plugin id. Publish from **Settings → Developer → Plugins**.
