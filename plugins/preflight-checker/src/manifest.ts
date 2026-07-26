import { defineManifest } from '@corte/plugin-types'

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.preflight',
  name: 'Pre-flight Checker',
  pluginVersion: '1.0.2',
  description: 'Audit your timeline before export: gaps, flash-frame clips, missing audio, and platform duration limits.',
  about: `Designed an edit and about to export? Pre-flight Checker reads your timeline and reports the things that quietly ruin a published video — before you spend an export on them.

What it checks: gaps between clips on a track (black flashes), clips shorter than a quarter second (flash frames), a timeline with no audio at all, and your total duration against the platform you name (TikTok, Reels, Shorts, or a custom limit).

Everything is read-only. Ask the editing agent to "run a pre-flight check for reels" and it reports; nothing on your timeline changes.`,
  tags: ['qa', 'export', 'social'],
  iconUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/plugins/preflight-checker/assets/icon.png',
  permissions: ['read:timeline', 'notify'],
  contributions: {
    tools: [
      {
        name: 'so.corte.preflight.check',
        description:
          'Audit the active timeline before export: report gaps between clips, flash-frame clips (< 0.25s), missing audio, and total duration vs. a platform limit. Read-only.',
        inputSchema: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              enum: ['tiktok', 'reels', 'shorts', 'none'],
              description: 'Platform whose duration limit to check against (default none).',
            },
            maxSeconds: {
              type: 'number',
              description: 'Custom duration limit in seconds; overrides platform.',
            },
          },
        },
        readOnly: true,
      },
    ],
  },
})
