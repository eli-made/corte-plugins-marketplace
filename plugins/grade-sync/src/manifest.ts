import { defineManifest } from '@corte/plugin-types'
import { MOODS } from './presets.ts'

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.gradesync',
  name: 'Grade Sync',
  pluginVersion: '1.0.0',
  description:
    'Give every clip in a cut the same look in one instruction. Pick a mood — cinematic, warm, cool, vivid or matte — and Grade Sync applies a matched exposure, contrast, saturation, white balance and vignette to your selection or the whole timeline, using Corte’s built-in colour effects so everything stays editable afterwards.',
  about: `Footage from three cameras, a phone and a stock clip never matches. Grade Sync is the quick pass that makes a cut feel like one piece: choose a mood and every clip gets the same five-step grade.

The moods are conservative on purpose. Each one is an exposure nudge, a small contrast lift, a saturation adjustment, a white-balance target and a vignette — the same moves a colourist starts with, not a filter stack.

Nothing is locked. Grade Sync only ever applies Corte's own built-in colour effects, so every value it sets shows up in the Adjust panel where you can push it further, keyframe it, or reset a single clip. Uninstalling the plugin leaves your grade exactly where it is.

Ask the editing agent to "grade everything cinematic" for the whole timeline, or select a few clips first and say "match these to the warm look".`,
  iconUrl: 'https://assets.corte.so/plugins/grade-sync/icon.png',
  screenshots: [
    'https://assets.corte.so/plugins/grade-sync/moods.png',
    'https://assets.corte.so/plugins/grade-sync/before-after.png',
  ],
  tags: ['color', 'grading', 'agent', 'workflow'],
  permissions: ['read:timeline', 'write:effects', 'notify'],
  contributions: {
    tools: [
      {
        name: 'so.corte.gradesync.apply',
        description:
          'Apply a consistent colour grade to timeline clips. Sets exposure, contrast, saturation, white balance and a vignette from one of five moods, using built-in effects that stay editable in the Adjust panel.',
        inputSchema: {
          type: 'object',
          properties: {
            mood: {
              type: 'string',
              // Sourced from the preset table so a new mood cannot be shipped
              // without the agent being told it exists.
              enum: MOODS,
              description: 'Which look to apply.',
            },
            scope: {
              type: 'string',
              enum: ['selected', 'all'],
              description: 'Grade the selected clips (default) or every video clip on the timeline.',
            },
          },
          required: ['mood'],
        },
      },
    ],
  },
})
