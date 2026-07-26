/**
 * The eight hook archetypes — the single source both contributions are built
 * from. The manifest turns each one into a start-from-template; the bundle
 * turns the same one into a stack of `addText` calls on the timeline you are
 * already in. Defining them once is what keeps "The Countdown" the template and
 * "The Countdown" the tool from drifting into two different edits.
 */

export interface HookOverlay {
  content: string
  startFrame: number
  endFrame: number
}

export interface Hook {
  /** Also the template id suffix, so it stays URL- and id-safe. */
  slug: string
  name: string
  description: string
  /** Beats of the hook, in order. */
  overlays: HookOverlay[]
}

/** Vertical, 30 fps — where hooks are actually watched. */
export const HOOK_FORMAT = { width: 1080, height: 1920, fps: 30 } as const

/** A hook has to land before the viewer scrolls: three seconds, thirty fps. */
export const HOOK_WINDOW_FRAMES = 90

export const HOOKS: Hook[] = [
  {
    slug: 'the-question',
    name: 'The Question',
    description: 'Open on the question the viewer already has, then admit nobody answered it.',
    overlays: [
      { content: 'Why does nobody talk about this?', startFrame: 0, endFrame: 45 },
      { content: 'I could not find a straight answer either', startFrame: 45, endFrame: 90 },
    ],
  },
  {
    slug: 'the-countdown',
    name: 'The Countdown',
    description: 'Promise a numbered list and park the payoff at the end.',
    overlays: [
      { content: '3 things I wish I knew sooner', startFrame: 0, endFrame: 36 },
      { content: 'Number 2 changed everything', startFrame: 36, endFrame: 66 },
      { content: 'Stay for the last one', startFrame: 66, endFrame: 90 },
    ],
  },
  {
    slug: 'the-hot-take',
    name: 'The Hot Take',
    description: 'Stake out a position, then ask for thirty seconds to defend it.',
    overlays: [
      { content: 'Unpopular opinion:', startFrame: 0, endFrame: 30 },
      { content: 'You are doing this backwards', startFrame: 30, endFrame: 72 },
      { content: 'Hear me out', startFrame: 72, endFrame: 90 },
    ],
  },
  {
    slug: 'the-mistake',
    name: 'The Mistake',
    description: 'Lead with what it cost you — the cheapest way to buy attention.',
    overlays: [
      { content: 'I wasted 2 years on this', startFrame: 0, endFrame: 42 },
      { content: 'Do not repeat my mistake', startFrame: 42, endFrame: 90 },
    ],
  },
  {
    slug: 'the-reveal',
    name: 'The Reveal',
    description: 'Point at a moment later in the video and make them wait for it.',
    overlays: [
      { content: 'Watch what happens at 0:15', startFrame: 0, endFrame: 40 },
      { content: 'No, seriously', startFrame: 40, endFrame: 70 },
      { content: 'Wait for it', startFrame: 70, endFrame: 90 },
    ],
  },
  {
    slug: 'the-before-after',
    name: 'The Before / After',
    description: 'Two states and the gap between them, stated in numbers.',
    overlays: [
      { content: 'Before', startFrame: 0, endFrame: 30 },
      { content: 'After', startFrame: 30, endFrame: 60 },
      { content: 'Same room. 20 minutes.', startFrame: 60, endFrame: 90 },
    ],
  },
  {
    slug: 'the-listicle',
    name: 'The Listicle',
    description: 'A rule set, with the first one given away for free.',
    overlays: [
      { content: '5 rules I never break', startFrame: 0, endFrame: 45 },
      { content: 'Number 1 is free', startFrame: 45, endFrame: 90 },
    ],
  },
  {
    slug: 'the-callout',
    name: 'The Call-Out',
    description: 'Name the behaviour, then tell them the video is for them.',
    overlays: [
      { content: 'If you have ever done this', startFrame: 0, endFrame: 36 },
      { content: 'This one is for you', startFrame: 36, endFrame: 72 },
      { content: 'Yes, you', startFrame: 72, endFrame: 90 },
    ],
  },
]

export const HOOK_SLUGS = HOOKS.map((hook) => hook.slug)

export function findHook(slug: unknown): Hook | undefined {
  return typeof slug === 'string' ? HOOKS.find((hook) => hook.slug === slug) : undefined
}
