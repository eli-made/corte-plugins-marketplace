import { defineManifest } from '@corte/plugin-types'
import { HOOK_FORMAT, HOOK_SLUGS, HOOKS } from './hooks.ts'

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.hooks',
  name: 'Hook Factory',
  pluginVersion: '1.0.2',
  description:
    'Eight opening hooks that stop the scroll — The Question, The Countdown, The Hot Take and five more — as vertical templates you can start from, or as a text stack the editing agent drops onto the cut you already have. Every hook lands inside the first three seconds. Swap the placeholder copy for your own and you are done.',
  about: `The first three seconds decide whether anything else in your video gets watched. Hook Factory is eight opening patterns that reliably buy those seconds, written out as timed text stacks rather than as advice.

Start a new vertical project from any of the eight templates, or — more usefully — keep the edit you have and ask the editing agent to drop a hook on the front of it. Each archetype is two or three overlays with their own timing, all landing inside the first 90 frames.

The copy that ships is placeholder, and it is meant to be replaced. "3 things I wish I knew sooner" is the shape of the hook; your version of it is the actual hook. Every overlay is a normal text clip once inserted, so restyle, retime and move them like anything else on the timeline.`,
  iconUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/plugins/hook-factory/assets/icon.png',
  screenshots: [
    'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/plugins/hook-factory/assets/archetypes.png',
    'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/plugins/hook-factory/assets/insert.png',
  ],
  tags: ['social', 'templates', 'hooks', 'shorts', 'agent'],
  permissions: ['write:clips', 'notify'],
  contributions: {
    // Templates and the insert tool are two faces of the same eight hooks —
    // both are generated from src/hooks.ts so they cannot describe different edits.
    templates: HOOKS.map((hook) => ({
      id: `so.corte.hooks.${hook.slug}`,
      name: hook.name,
      description: hook.description,
      category: 'Openers & stings',
      ...HOOK_FORMAT,
      texts: hook.overlays,
      thumbnailUrl: `https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/plugins/hook-factory/assets/${hook.slug}.png`,
    })),
    tools: [
      {
        name: 'so.corte.hooks.insert',
        description:
          'Insert an opening hook onto the current timeline as timed text overlays across the first three seconds. Archetypes: ' +
          HOOKS.map((hook) => `${hook.slug} (${hook.name})`).join(', ') +
          '.',
        inputSchema: {
          type: 'object',
          properties: {
            archetype: {
              type: 'string',
              enum: HOOK_SLUGS,
              description: 'Which hook archetype to insert.',
            },
          },
          required: ['archetype'],
        },
      },
    ],
  },
})
