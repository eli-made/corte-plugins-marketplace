import { defineManifest } from '@corte/plugin-types'

/** Every asset and thumbnail lives under this prefix; placeholders until the
 *  kit's media is uploaded (see README). */
const ASSETS = 'https://assets.corte.so/plugins/real-estate-kit'

/** All three templates cut at 30 fps — the rate listing footage is shot and
 *  delivered at, so slot frame math stays whole. */
const FPS = 30
const seconds = (n: number): number => n * FPS

export const manifest = defineManifest({
  version: 1,
  id: 'so.corte.rekit',
  name: 'Real Estate Kit',
  pluginVersion: '1.0.0',
  description:
    'Listing videos without the setup: three ready-made property templates (vertical reel, widescreen tour, square open house), eight stock clips they fill themselves, and a one-call listing lower third.',
  about: `Every listing gets the same video: the exterior, the walkthrough, the kitchen, the price. Real Estate Kit ships that edit so you only bring the property.

Three templates cover the formats a listing actually goes out in — a 9:16 Listing Reel for social, a 16:9 Property Tour for the MLS and your site, and a 1:1 Open House card for the feed. Each one arrives with its slots already asking for the right shot (aerial exterior, interior, kitchen, dusk), so dropping in your own footage fills the cut in order.

Eight vertical-specific stock clips back the templates, so a new listing has something to cut against before the shoot is even edited — swap them out shot by shot as your own footage lands.

The kit also adds a lower-third tool: give the agent an address, the specs, and the price, and it lays the three lines onto the timeline as a staggered title block, timed and stacked.`,
  iconUrl: `${ASSETS}/icon.png`,
  tags: ['real-estate', 'templates', 'listings', 'stock', 'vertical'],
  screenshots: [`${ASSETS}/screenshot-1.png`, `${ASSETS}/screenshot-2.png`],
  permissions: ['read:timeline', 'write:clips', 'notify'],
  contributions: {
    library: [
      {
        id: 'so.corte.rekit.asset.exterior-front-day',
        kind: 'video',
        name: 'Exterior — front elevation, midday',
        url: `${ASSETS}/video/exterior-front-day.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/exterior-front-day.jpg`,
        tags: ['exterior', 'day', 'establishing'],
        vertical: 'real-estate',
        durationSeconds: 8,
      },
      {
        id: 'so.corte.rekit.asset.aerial-approach',
        kind: 'video',
        name: 'Aerial — slow approach over the lot',
        url: `${ASSETS}/video/aerial-approach.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/aerial-approach.jpg`,
        tags: ['aerial', 'exterior', 'establishing'],
        vertical: 'real-estate',
        durationSeconds: 10,
      },
      {
        id: 'so.corte.rekit.asset.entry-walkthrough',
        kind: 'video',
        name: 'Interior — entry walkthrough',
        url: `${ASSETS}/video/entry-walkthrough.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/entry-walkthrough.jpg`,
        tags: ['interior', 'walkthrough', 'entry'],
        vertical: 'real-estate',
        durationSeconds: 9,
      },
      {
        id: 'so.corte.rekit.asset.kitchen-island-pan',
        kind: 'video',
        name: 'Interior — kitchen island pan',
        url: `${ASSETS}/video/kitchen-island-pan.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/kitchen-island-pan.jpg`,
        tags: ['interior', 'kitchen'],
        vertical: 'real-estate',
        durationSeconds: 7,
      },
      {
        id: 'so.corte.rekit.asset.living-room-light',
        kind: 'video',
        name: 'Interior — living room, afternoon light',
        url: `${ASSETS}/video/living-room-light.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/living-room-light.jpg`,
        tags: ['interior', 'living-room'],
        vertical: 'real-estate',
        durationSeconds: 8,
      },
      {
        id: 'so.corte.rekit.asset.primary-suite',
        kind: 'video',
        name: 'Interior — primary suite reveal',
        url: `${ASSETS}/video/primary-suite.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/primary-suite.jpg`,
        tags: ['interior', 'bedroom'],
        vertical: 'real-estate',
        durationSeconds: 7,
      },
      {
        id: 'so.corte.rekit.asset.pool-backyard',
        kind: 'video',
        name: 'Exterior — pool and backyard',
        url: `${ASSETS}/video/pool-backyard.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/pool-backyard.jpg`,
        tags: ['pool', 'exterior', 'backyard'],
        vertical: 'real-estate',
        durationSeconds: 9,
      },
      {
        id: 'so.corte.rekit.asset.dusk-twilight-exterior',
        kind: 'video',
        name: 'Exterior — twilight, lights on',
        url: `${ASSETS}/video/dusk-twilight-exterior.mp4`,
        thumbnailUrl: `${ASSETS}/thumb/dusk-twilight-exterior.jpg`,
        tags: ['dusk', 'exterior', 'aerial'],
        vertical: 'real-estate',
        durationSeconds: 10,
      },
    ],
    templates: [
      {
        id: 'so.corte.rekit.template.listing-reel',
        name: 'Listing Reel',
        description:
          'Vertical 12s listing walkthrough: aerial hook, entry, kitchen, twilight closer, with address and price titles.',
        category: 'Slideshows & promos',
        width: 1080,
        height: 1920,
        fps: FPS,
        thumbnailUrl: `${ASSETS}/thumb/template-listing-reel.jpg`,
        slots: [
          {
            role: 'hook',
            kind: 'video',
            query: { kind: 'video', tags: ['aerial', 'exterior'], vertical: 'real-estate' },
            startFrame: 0,
            endFrame: seconds(3),
            trackIndex: 0,
          },
          {
            role: 'entry',
            kind: 'video',
            query: { kind: 'video', tags: ['interior', 'walkthrough'], vertical: 'real-estate' },
            startFrame: seconds(3),
            endFrame: seconds(6),
            trackIndex: 0,
          },
          {
            role: 'kitchen',
            kind: 'video',
            query: { kind: 'video', tags: ['kitchen'], vertical: 'real-estate' },
            startFrame: seconds(6),
            endFrame: seconds(9),
            trackIndex: 0,
          },
          {
            role: 'closer',
            kind: 'video',
            query: { kind: 'video', tags: ['dusk', 'exterior'], vertical: 'real-estate' },
            startFrame: seconds(9),
            endFrame: seconds(12),
            trackIndex: 0,
          },
        ],
        texts: [
          { content: '123 EXAMPLE AVENUE', startFrame: seconds(0.5), endFrame: seconds(4) },
          { content: '4 bd · 3 ba · 2,400 sqft', startFrame: seconds(1), endFrame: seconds(4) },
          { content: '$1,250,000 · tap for the tour', startFrame: seconds(9), endFrame: seconds(12) },
        ],
      },
      {
        id: 'so.corte.rekit.template.property-tour',
        name: 'Property Tour',
        description: 'Widescreen 15s tour: exterior establishing, interior, backyard — sized for the MLS and your site.',
        category: 'Slideshows & promos',
        width: 1920,
        height: 1080,
        fps: FPS,
        thumbnailUrl: `${ASSETS}/thumb/template-property-tour.jpg`,
        slots: [
          {
            role: 'establishing',
            kind: 'video',
            query: { kind: 'video', tags: ['exterior', 'establishing'], vertical: 'real-estate' },
            startFrame: 0,
            endFrame: seconds(5),
            trackIndex: 0,
          },
          {
            role: 'interior',
            kind: 'video',
            query: { kind: 'video', tags: ['interior'], vertical: 'real-estate' },
            startFrame: seconds(5),
            endFrame: seconds(10),
            trackIndex: 0,
          },
          {
            role: 'outdoor',
            kind: 'video',
            query: { kind: 'video', tags: ['pool', 'backyard'], vertical: 'real-estate' },
            startFrame: seconds(10),
            endFrame: seconds(15),
            trackIndex: 0,
          },
        ],
        texts: [
          { content: '123 EXAMPLE AVENUE', startFrame: seconds(0.5), endFrame: seconds(4.5) },
          { content: '$1,250,000', startFrame: seconds(11), endFrame: seconds(15) },
        ],
      },
      {
        id: 'so.corte.rekit.template.open-house',
        name: 'Open House',
        category: 'Slideshows & promos',
        description: 'Square 6s open-house announcement: one hero shot with the date and address over it.',
        width: 1080,
        height: 1080,
        fps: FPS,
        thumbnailUrl: `${ASSETS}/thumb/template-open-house.jpg`,
        slots: [
          {
            role: 'hero',
            kind: 'video',
            query: { kind: 'video', tags: ['exterior', 'day'], vertical: 'real-estate' },
            startFrame: 0,
            endFrame: seconds(6),
            trackIndex: 0,
          },
        ],
        texts: [
          { content: 'OPEN HOUSE · SAT 12–2 PM', startFrame: seconds(0.5), endFrame: seconds(6) },
          { content: '123 Example Avenue', startFrame: seconds(1), endFrame: seconds(6) },
        ],
      },
    ],
    tools: [
      {
        name: 'so.corte.rekit.lower_third',
        description:
          'Add a listing lower third to the timeline: the address as a headline plus optional specs and price lines, cascading in a few frames apart and leaving together.',
        inputSchema: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Street address; shown as the headline.' },
            specs: { type: 'string', description: 'Stat line, e.g. "4 bd · 3 ba · 2,400 sqft".' },
            price: { type: 'string', description: 'Price line, e.g. "$1,250,000".' },
            atSeconds: { type: 'number', description: 'When the block appears, in seconds (default 1).' },
            durationSeconds: { type: 'number', description: 'How long it stays up, in seconds (default 4).' },
          },
          required: ['address'],
        },
      },
    ],
  },
})
