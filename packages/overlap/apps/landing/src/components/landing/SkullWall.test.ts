import { describe, expect, it } from 'vite-plus/test'

import { WALL, skullWall, type Skull } from './SkullWall'

const SCREENS = [
  [390, 800],
  [1440, 900],
  [1920, 1080],
  [3440, 1440],
] as const

const centreInside = (width: number, height: number) => (skull: Skull) =>
  Math.abs(skull.x) < width / 2 && Math.abs(skull.y) < height / 2

/** The usual size: the one most skulls have. */
const usualSize = (skulls: Skull[]) => {
  const counts = new Map<number, number>()
  for (const { size } of skulls) counts.set(size, (counts.get(size) ?? 0) + 1)
  return [...counts].reduce((most, entry) => (entry[1] > most[1] ? entry : most))
}

describe('skullWall', () => {
  it('lays out the same wall every time, so every visit sees the same one', () => {
    expect(skullWall(1440, 900)).toEqual(skullWall(1440, 900))
  })

  it('puts 60 to 100 skulls on a phone and 150 to 300 on any larger screen', () => {
    for (const [width, height] of SCREENS) {
      const count = skullWall(width, height).filter(centreInside(width, height)).length
      expect(count).toBeGreaterThanOrEqual(width < 640 ? 60 : 150)
      expect(count).toBeLessThanOrEqual(width < 640 ? 100 : 300)
    }
  })

  it('only holds skulls that show, mostly of the usual size, within the sizes and tilt of WALL', () => {
    for (const [width, height] of SCREENS) {
      const skulls = skullWall(width, height)
      expect(
        skulls.every(({ x, y, size }) => Math.abs(x) - size / 2 < width / 2 && Math.abs(y) - size / 2 < height / 2),
      ).toBe(true)
      const [usual, count] = usualSize(skulls)
      expect(usual).toBeGreaterThanOrEqual(WALL.size.min)
      expect(count / skulls.length).toBeGreaterThan(0.7)
      for (const { size } of skulls) {
        expect(size).toBeGreaterThanOrEqual(Math.floor(usual * WALL.small.scale))
        expect(size).toBeLessThanOrEqual(Math.ceil(usual * WALL.giant.scale.max))
      }
      expect(skulls.some(({ size }) => size >= usual * WALL.giant.scale.min - 1)).toBe(true)
      expect(skulls.every(({ tilt }) => Math.abs(tilt) <= WALL.tilt)).toBe(true)
    }
  })

  it('leaves no gap: every point of the wall is within a pitch of a skull', () => {
    for (const [width, height] of SCREENS) {
      const skulls = skullWall(width, height)
      const pitch = usualSize(skulls)[0] * WALL.pitch.x
      for (let x = -width / 2; x <= width / 2; x += 20)
        for (let y = -height / 2; y <= height / 2; y += 20)
          expect(skulls.some((skull) => Math.hypot(skull.x - x, skull.y - y) < skull.size / 2 + pitch)).toBe(true)
    }
  })

  it('keeps every skull in its place when a wall grows at the same skull size', () => {
    const small = skullWall(390, 800)
    const large = skullWall(600, 900)
    expect(usualSize(large)[0]).toBe(usualSize(small)[0])
    expect(large).toEqual(expect.arrayContaining(small))
    expect(large.length).toBeGreaterThan(small.length)
  })
})
