/**
 * Static parity between each effect's declared uniform map and its GLSL. A
 * uniform the host binds but the shader never declares is silently dropped, and
 * the look ships subtly wrong with no error anywhere — cheap to catch here,
 * expensive to notice in a preview.
 */
import { describe, expect, it } from 'vitest'
import { manifest } from './manifest.ts'

const effects = manifest.contributions.effects ?? []

describe('Film Lab shaders', () => {
  it('ships thirteen looks', () => {
    expect(effects).toHaveLength(13)
  })

  it.each(effects.map((e) => [e.type, e] as const))('%s honours the host shader contract', (_type, effect) => {
    const src = effect.fragmentShader ?? ''
    expect(src.startsWith('#version 300 es\n')).toBe(true)
    expect(src).toContain('precision highp float;')
    expect(src).toContain('uniform sampler2D uTex;')
    expect(src).toContain('out vec4 fragColor;')
    // Sampling anywhere other than the host's varying would ignore the clip's
    // transform, so every look must read uTex at vUV.
    expect(src).toContain('texture(uTex, vUV')
    // WebGL restricts shader source to the GLSL ES character set. A typographic
    // dash smuggled into a comment can fail the whole program on some drivers,
    // and the effect then silently no-ops in preview and export alike.
    expect(src.match(/[^\x20-\x7E\n]/g) ?? []).toEqual([])
  })

  it.each(effects.map((e) => [e.type, e] as const))('%s declares every uniform it binds', (_type, effect) => {
    const src = effect.fragmentShader ?? ''
    const uniforms = Object.entries(effect.uniforms ?? {})
    expect(uniforms.length).toBeGreaterThan(0)
    for (const [uniformName, paramKey] of uniforms) {
      expect(src).toContain(`uniform float ${uniformName};`)
      expect(effect.params.map((p) => p.key)).toContain(paramKey)
    }
    // Params without a binding are dead sliders: they move and nothing happens.
    expect(effect.params.map((p) => p.key).sort()).toEqual(uniforms.map(([, key]) => key).sort())
  })

  it('gives every look an Amount blend so defaults are a starting point', () => {
    for (const effect of effects) {
      const amount = effect.params.find((p) => p.key === 'amount')
      expect(amount, `${effect.type} has no amount param`).toBeDefined()
      expect(amount!.default).toBeGreaterThan(0)
      expect(amount!.default).toBeLessThan(1)
    }
  })

  it('keeps every param default inside its own range', () => {
    for (const effect of effects) {
      for (const p of effect.params) {
        expect(p.default, `${effect.type}.${p.key}`).toBeGreaterThanOrEqual(p.min)
        expect(p.default, `${effect.type}.${p.key}`).toBeLessThanOrEqual(p.max)
      }
    }
  })
})
