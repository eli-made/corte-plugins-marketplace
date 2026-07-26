import { describe, expect, it } from 'vitest'
import { buildLowerThird } from './lowerThird.ts'

describe('buildLowerThird', () => {
  it('cascades the three lines and lands them on a shared exit', () => {
    const lines = buildLowerThird(
      { address: '18 Calle Verde', specs: '4 bd · 3 ba · 2,400 sqft', price: '$1,250,000' },
      30,
    )

    expect(lines.map((l) => [l.role, l.content, l.startFrame, l.endFrame])).toEqual([
      ['address', '18 CALLE VERDE', 30, 150],
      ['specs', '4 bd · 3 ba · 2,400 sqft', 35, 150],
      ['price', '$1,250,000', 40, 150],
    ])
  })

  it('honours atSeconds and durationSeconds at the timeline fps', () => {
    const [line] = buildLowerThird({ address: '18 Calle Verde', atSeconds: 2, durationSeconds: 3 }, 24)
    expect(line).toMatchObject({ startFrame: 48, endFrame: 120 })
  })

  it('omits the optional lines and closes the cascade gap', () => {
    const lines = buildLowerThird({ address: '18 Calle Verde', price: '$1,250,000' }, 30)
    expect(lines.map((l) => l.role)).toEqual(['address', 'price'])
    expect(lines[1].startFrame).toBe(35)
  })

  it('returns nothing without an address', () => {
    expect(buildLowerThird({ address: '   ', price: '$1,250,000' }, 30)).toEqual([])
  })

  it('keeps every line on screen when the block is shorter than the cascade', () => {
    const lines = buildLowerThird(
      { address: '18 Calle Verde', specs: '4 bd', price: '$1,250,000', atSeconds: 0, durationSeconds: 0.1 },
      30,
    )
    for (const line of lines) expect(line.startFrame).toBeLessThan(line.endFrame)
  })

  it('falls back to 30 fps when the timeline reports an unusable rate', () => {
    const [line] = buildLowerThird({ address: '18 Calle Verde' }, 0)
    expect(line).toMatchObject({ startFrame: 30, endFrame: 150 })
  })
})
