import { defineManifest } from '@corte/plugin-types'

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.translate',
  name: 'Caption Translator',
  pluginVersion: '1.0.2',
  description:
    'Translate every text clip on the timeline into another language in one pass — offline for common call-to-action lines, or through your own LibreTranslate-compatible endpoint.',
  about: `Shipping the same cut to another market usually means retyping every caption. Caption Translator reads the text clips on your timeline, translates them, and writes them back in place — one pass, no re-layout.

It works with no setup: a built-in phrasebook covers the short calls to action that carry most short-form video ("subscribe", "link in bio", "wait for it", "sound on"…) in Spanish, French, and German, matching the original line's capitalization. Nothing leaves the browser.

Point it at a LibreTranslate-compatible endpoint and it translates arbitrary sentences instead, falling back to the phrasebook if that service is unreachable. That is the only reason the plugin asks for network access, and the endpoint is a per-call argument — it is never stored.

Lines it cannot translate are returned unchanged and reported as skipped, so you always know what still needs a human. Run it with dryRun first to review the proposed text before anything is written.`,
  iconUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/caption-translator/icon.png',
  tags: ['captions', 'localization', 'translation', 'social'],
  screenshots: ['https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/caption-translator/screenshot-1.png'],
  permissions: ['read:timeline', 'write:clips', 'notify', 'net:fetch'],
  contributions: {
    tools: [
      {
        name: 'so.corte.translate.captions',
        description:
          'Translate every text clip on the active timeline into targetLang and rewrite each clip in place. Uses a LibreTranslate-compatible endpoint when one is given, otherwise an offline phrasebook of common call-to-action lines (es/fr/de). Lines that cannot be translated are left untouched and reported as skipped. Pass dryRun to return the proposed translations without editing the timeline.',
        inputSchema: {
          type: 'object',
          properties: {
            targetLang: {
              type: 'string',
              description: 'Target language tag, e.g. "es", "fr", "de" (regional forms like "es-MX" are accepted).',
            },
            endpoint: {
              type: 'string',
              description:
                'Optional https base URL of a LibreTranslate-compatible service; its POST /translate is called per line.',
            },
            dryRun: {
              type: 'boolean',
              description: 'Return the proposed translations without writing them to the timeline (default false).',
            },
          },
          required: ['targetLang'],
        },
      },
    ],
  },
})
