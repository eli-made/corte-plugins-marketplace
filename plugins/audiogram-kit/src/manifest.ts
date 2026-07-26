import { defineManifest } from '@corte/plugin-types'

/** Both formats run 30 seconds at 30 fps — the length a clip has to be to
 *  survive a feed, and short enough that the text can hold the whole shot. */
const DURATION_FRAMES = 900

/** Every template asks the library for a bed by tag rather than naming one
 *  asset, so a listener can swap beds without the layout caring which. */
const BED_SLOT = {
  role: 'bed' as const,
  kind: 'audio' as const,
  query: { kind: 'audio' as const, tags: ['bed', 'podcast'] },
  startFrame: 0,
  endFrame: DURATION_FRAMES,
  trackIndex: 1,
}

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.audiogram',
  name: 'Audiogram Kit',
  pluginVersion: '1.0.2',
  description:
    'Turn a podcast clip into something watchable. Six audiogram layouts — three square for the feed, three vertical for Shorts and Reels — with pull-quote, episode-title and @handle text already positioned and timed, plus four royalty-free music beds the layouts pull in automatically.',
  about: `A podcast clip posted as a waveform gets scrolled past. Audiogram Kit is the six layouts that give it something to look at: a pull quote big enough to read at arm's length, the episode title where a lower third belongs, and your handle sitting quietly at the bottom of every one.

Three are square for the main feed and three are vertical for Shorts and Reels, so a single episode can go out in both shapes without rebuilding the layout twice.

Four music beds ship alongside — warm keys, soft pulse, low strings, clean lo-fi — each a minute long and mixed to sit under speech rather than compete with it. The templates request a bed by tag instead of by name, so swapping one for another is a single change.

Drop your audio in, replace the placeholder copy, and export. Editing and export are free and never watermarked.`,
  iconUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/icon.png',
  screenshots: [
    'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/square-layouts.png',
    'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/vertical-layouts.png',
  ],
  tags: ['podcast', 'audiogram', 'templates', 'social', 'audio'],
  contributions: {
    templates: [
      {
        id: 'so.corte.audiogram.square-pull-quote',
        name: 'Square — Pull Quote',
        description: 'One big centred quote, handle underneath. The layout for a line that carries itself.',
        category: 'Titles & social',
        width: 1080,
        height: 1080,
        fps: 30,
        texts: [
          { content: '“The part nobody tells you is that it takes twice as long.”', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: '@yourshow', startFrame: 0, endFrame: DURATION_FRAMES },
        ],
        slots: [BED_SLOT],
        thumbnailUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/square-pull-quote.png',
      },
      {
        id: 'so.corte.audiogram.square-episode-card',
        name: 'Square — Episode Card',
        description: 'Show name up top, episode title as a lower third, handle in the footer.',
        category: 'Titles & social',
        width: 1080,
        height: 1080,
        fps: 30,
        texts: [
          { content: 'THE SHOW', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: 'Ep. 42 — What we got wrong about hiring', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: '@yourshow', startFrame: 0, endFrame: DURATION_FRAMES },
        ],
        slots: [BED_SLOT],
        thumbnailUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/square-episode-card.png',
      },
      {
        id: 'so.corte.audiogram.square-guest-intro',
        name: 'Square — Guest Intro',
        description: 'Guest name and role, with the episode title small underneath. For the clip that introduces someone.',
        category: 'Titles & social',
        width: 1080,
        height: 1080,
        fps: 30,
        texts: [
          { content: 'ALEX RIVERA', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: 'Head of Design, Northwind', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: '@yourshow · Ep. 42', startFrame: 0, endFrame: DURATION_FRAMES },
        ],
        slots: [BED_SLOT],
        thumbnailUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/square-guest-intro.png',
      },
      {
        id: 'so.corte.audiogram.vertical-pull-quote',
        name: 'Vertical — Pull Quote',
        description: 'The centred quote layout, retuned for Shorts and Reels with the handle in the safe zone.',
        category: 'Titles & social',
        width: 1080,
        height: 1920,
        fps: 30,
        texts: [
          { content: '“The part nobody tells you is that it takes twice as long.”', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: '@yourshow', startFrame: 0, endFrame: DURATION_FRAMES },
        ],
        slots: [BED_SLOT],
        thumbnailUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/vertical-pull-quote.png',
      },
      {
        id: 'so.corte.audiogram.vertical-episode-card',
        name: 'Vertical — Episode Card',
        description: 'Show name, episode title as a lower third, handle in the footer — full height.',
        category: 'Titles & social',
        width: 1080,
        height: 1920,
        fps: 30,
        texts: [
          { content: 'THE SHOW', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: 'Ep. 42 — What we got wrong about hiring', startFrame: 0, endFrame: DURATION_FRAMES },
          { content: '@yourshow', startFrame: 0, endFrame: DURATION_FRAMES },
        ],
        slots: [BED_SLOT],
        thumbnailUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/vertical-episode-card.png',
      },
      {
        id: 'so.corte.audiogram.vertical-clip-teaser',
        name: 'Vertical — Clip Teaser',
        description: 'Hook line first, quote second, handle throughout. Built for a cold audience.',
        category: 'Titles & social',
        width: 1080,
        height: 1920,
        fps: 30,
        texts: [
          { content: 'The hiring advice everyone repeats', startFrame: 0, endFrame: 90 },
          { content: '“…and it is wrong for almost every team.”', startFrame: 90, endFrame: DURATION_FRAMES },
          { content: '@yourshow', startFrame: 0, endFrame: DURATION_FRAMES },
        ],
        slots: [BED_SLOT],
        thumbnailUrl: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/vertical-clip-teaser.png',
      },
    ],
    library: [
      {
        id: 'so.corte.audiogram.bed-warm-keys',
        kind: 'audio',
        name: 'Warm Keys',
        url: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/beds/warm-keys.mp3',
        tags: ['music', 'bed', 'podcast'],
        durationSeconds: 60,
      },
      {
        id: 'so.corte.audiogram.bed-soft-pulse',
        kind: 'audio',
        name: 'Soft Pulse',
        url: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/beds/soft-pulse.mp3',
        tags: ['music', 'bed', 'podcast'],
        durationSeconds: 60,
      },
      {
        id: 'so.corte.audiogram.bed-low-strings',
        kind: 'audio',
        name: 'Low Strings',
        url: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/beds/low-strings.mp3',
        tags: ['music', 'bed', 'podcast'],
        durationSeconds: 60,
      },
      {
        id: 'so.corte.audiogram.bed-clean-lofi',
        kind: 'audio',
        name: 'Clean Lo-Fi',
        url: 'https://raw.githubusercontent.com/eli-made/corte-plugins-marketplace/main/assets/audiogram-kit/beds/clean-lofi.mp3',
        tags: ['music', 'bed', 'podcast'],
        durationSeconds: 60,
      },
    ],
  },
})
