import { describe, expect, it } from 'vite-plus/test'

import { FLASH, flashTimeline, mayFlash } from './use-error-flash'

const values = (keyframes: Keyframe[], property: string) => keyframes.map((keyframe) => keyframe[property])
const offsets = (keyframes: Keyframe[]) =>
  keyframes.map((keyframe) => keyframe.offset).filter((offset) => offset != null)

describe('mayFlash', () => {
  it('flashes at most once a second (WCAG 2.3.1)', () => {
    expect(mayFlash(-Infinity, 0)).toBe(true)
    expect(mayFlash(5000, 5000)).toBe(false)
    expect(mayFlash(5000, 5999)).toBe(false)
    expect(mayFlash(5000, 6000)).toBe(true)
  })
})

describe('flashTimeline', () => {
  it('is over before the next flash may start, so two flashes never run together', () => {
    for (const reduced of [false, true]) expect(flashTimeline(reduced).duration).toBeLessThan(FLASH.interval)
  })

  it('pulses fully red, then fades out', () => {
    const { duration, tint } = flashTimeline(false)
    expect(values(tint, 'opacity')).toEqual([0, 1, 1, 0])
    expect(offsets(tint)).toEqual([FLASH.attack / duration, FLASH.hold / duration])
    expect(FLASH.attack).toBeLessThan(FLASH.hold)
  })

  it('zooms in by 1 to 1.5 % at the peak of the red and back to exactly 1', () => {
    const { tint, zoom } = flashTimeline(false)
    expect(zoom).not.toBeNull()
    const [from, peak, to] = values(zoom!, 'scale') as number[]
    expect([from, to]).toEqual([1, 1])
    expect(peak).toBeGreaterThanOrEqual(1.01)
    expect(peak).toBeLessThanOrEqual(1.015)
    expect(zoom![1].offset).toBe(tint[2].offset)
  })

  it('only tints softly, and never zooms, under reduced motion', () => {
    const { tint, zoom } = flashTimeline(true)
    expect(zoom).toBeNull()
    const opacities = values(tint, 'opacity') as number[]
    expect(Math.max(...opacities)).toBeLessThanOrEqual(0.2)
    expect(opacities.at(-1)).toBe(0)
  })
})
