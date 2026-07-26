import { defineManifest } from '@corte/plugin-types'

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.beatmatch',
  name: 'Beat Match',
  pluginVersion: '1.0.1',
  description:
    'Find the beats in a music track and cut to them: report the tempo, snap selected clips onto the nearest beat, or split them at every beat they contain.',
  about: `Cutting to music by ear means scrubbing for the downbeat, nudging a clip, and doing it again for every shot. Beat Match does the scrubbing.

Point it at a music asset and it analyses the audio the host decodes for it — an energy-flux onset detector, so it finds the transients you would have cut to anyway — then reports the beat positions and a tempo estimate.

From there, "snap" moves each selected clip to the nearest beat, and "split" cuts each selected clip at every beat inside it, which turns one long take into a shot per beat ready to trim.

Analysis is read-only and instant; nothing changes until you ask for snap or split, and both act only on the clips you have selected.`,
  iconUrl: 'https://assets.corte.so/plugins/beat-match/icon.png',
  tags: ['audio', 'music', 'editing', 'rhythm'],
  screenshots: ['https://assets.corte.so/plugins/beat-match/screenshot-1.png'],
  permissions: ['read:timeline', 'read:media', 'write:clips', 'notify'],
  contributions: {
    tools: [
      {
        name: 'so.corte.beatmatch.analyze',
        description:
          'Detect the beats in an audio or video asset and report their positions in seconds plus a tempo estimate (median inter-beat interval, in bpm). Read-only; the beats list is capped at the first 200.',
        inputSchema: {
          type: 'object',
          properties: {
            assetId: { type: 'string', description: 'Id of the media asset to analyse.' },
            targetHz: {
              type: 'number',
              description: 'Sample rate to analyse at, in Hz (default 8000). Higher costs time without finding more beats.',
            },
          },
          required: ['assetId'],
        },
        readOnly: true,
      },
      {
        name: 'so.corte.beatmatch.snap',
        description:
          'Align the SELECTED clips to the beats of an audio asset. mode "move" (default) shifts each selected clip so it starts on the nearest beat; mode "split" cuts each selected clip at every beat that falls inside it.',
        inputSchema: {
          type: 'object',
          properties: {
            assetId: { type: 'string', description: 'Id of the media asset whose beats to snap to.' },
            mode: {
              type: 'string',
              enum: ['move', 'split'],
              description: 'move: shift clips onto the nearest beat. split: cut clips at every contained beat. Default move.',
            },
          },
          required: ['assetId'],
        },
      },
    ],
  },
})
