# Caption Translator

Translate every text clip on the timeline in one pass and write the results
back in place. Works offline out of the box; point it at your own
LibreTranslate-compatible endpoint for full-sentence translation.

**Try it:** ask the editing agent *“translate the captions to Spanish, dry run
first”*.

| | |
| --- | --- |
| Contributions | 1 agent tool (`so.corte.translate.captions`) |
| Permissions | `read:timeline`, `write:clips`, `notify`, `net:fetch` |
| Price | Free |

## Why there is an offline fallback

The sandbox has no network unless you grant `net:fetch`, and even then the
plugin has no service of its own to call — there is no key baked in, and the
`endpoint` argument is per-call rather than stored. So the default path has to
work with nothing but the bundle: a built-in phrasebook of ~27 short
call-to-action lines (“subscribe”, “link in bio”, “wait for it”, “sound on”…)
in Spanish, French, and German, matched whole-string with the original
capitalization and trailing punctuation preserved.

That covers the lines that repeat across short-form edits and nothing else, so
anything it doesn't know comes back **unchanged and marked untranslated**
rather than guessed at. Supplying an `endpoint` swaps in real translation for
arbitrary sentences; if that service is unreachable, misbehaving, or not
`https`, the call degrades to the phrasebook instead of failing the pass.

## Structure

- `src/manifest.ts` — the published contract (tool descriptor, permissions, copy)
- `src/translate.ts` — pure translation logic (phrasebook + endpoint), unit-tested in `translate.test.ts`
- `src/plugin.ts` — the sandbox bundle: wires the handler to the manifest-declared tool

Asset URLs in the manifest (`iconUrl`, `screenshots`) are placeholders under
`https://assets.corte.so/plugins/caption-translator/` — replace them with real
uploads before publishing.

Build with `npm run build` (from this directory or via the repo root) —
emits `dist/manifest.json` + `dist/plugin.js` and fails on any drift between
them. Publish both from **Settings → Developer → Plugins**.
