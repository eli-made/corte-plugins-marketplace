import { describe, expect, it } from 'vitest'
import { findHook, HOOK_SLUGS, HOOK_WINDOW_FRAMES, HOOKS } from './hooks.ts'
import { manifest } from './manifest.ts'

describe('hook archetypes', () => {
  it('ships eight, each with a unique slug', () => {
    expect(HOOKS).toHaveLength(8)
    expect(new Set(HOOK_SLUGS).size).toBe(8)
  })

  it('lands every overlay inside the first three seconds', () => {
    // Past 90 frames the hook is no longer a hook — the viewer has already
    // decided. This is the one constraint the copy must never break.
    for (const hook of HOOKS) {
      for (const overlay of hook.overlays) {
        expect(overlay.startFrame, `${hook.slug}`).toBeGreaterThanOrEqual(0)
        expect(overlay.endFrame, `${hook.slug}`).toBeLessThanOrEqual(HOOK_WINDOW_FRAMES)
        expect(overlay.endFrame, `${hook.slug}`).toBeGreaterThan(overlay.startFrame)
      }
    }
  })

  it('gives each hook two or three beats that run in order without gaps', () => {
    for (const hook of HOOKS) {
      expect(hook.overlays.length, hook.slug).toBeGreaterThanOrEqual(2)
      expect(hook.overlays.length, hook.slug).toBeLessThanOrEqual(3)
      expect(hook.overlays[0].startFrame, hook.slug).toBe(0)
      for (let i = 1; i < hook.overlays.length; i++) {
        expect(hook.overlays[i].startFrame, hook.slug).toBe(hook.overlays[i - 1].endFrame)
      }
    }
  })

  it('resolves a slug and rejects anything else', () => {
    expect(findHook('the-countdown')?.name).toBe('The Countdown')
    expect(findHook('the-vibe')).toBeUndefined()
    expect(findHook(42)).toBeUndefined()
  })
})

describe('manifest contributions', () => {
  const templates = manifest.contributions.templates ?? []

  it('publishes one vertical template per archetype, namespaced under the plugin id', () => {
    expect(templates).toHaveLength(8)
    for (const template of templates) {
      expect(template.id.startsWith(`${manifest.id}.`)).toBe(true)
      expect([template.width, template.height, template.fps]).toEqual([1080, 1920, 30])
      expect(template.category).toBe('Openers & stings')
    }
  })

  it('keeps template copy identical to what the tool inserts', () => {
    // The two contributions are generated from the same source; this asserts
    // the generation, so a future hand-edit to either one is caught.
    for (const hook of HOOKS) {
      const template = templates.find((t) => t.id === `${manifest.id}.${hook.slug}`)
      expect(template?.texts).toEqual(hook.overlays)
    }
  })

  it('advertises every archetype to the agent', () => {
    const schema = manifest.contributions.tools?.[0].inputSchema as {
      properties: { archetype: { enum: string[] } }
    }
    expect(schema.properties.archetype.enum).toEqual(HOOK_SLUGS)
  })
})
