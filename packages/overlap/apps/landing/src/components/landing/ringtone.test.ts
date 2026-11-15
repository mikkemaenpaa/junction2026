import { describe, expect, it } from 'vite-plus/test'

import { notesBetween, RING_LOOP } from './ringtone'

describe('notesBetween', () => {
  it('starts on the first strike of the phrase, an E5', () => {
    const [first, ...rest] = notesBetween(0, 0.1)
    expect(rest).toEqual([])
    expect(first).toMatchObject({ time: 0, level: 1 })
    expect(first?.frequency).toBeCloseTo(659.26, 1)
  })

  it('gives the strikes in order', () => {
    const times = notesBetween(0, RING_LOOP * 2).map(({ time }) => time)
    expect(times).toEqual(times.toSorted((a, b) => a - b))
  })

  it('leaves a window out that is empty or runs backwards', () => {
    expect(notesBetween(1, 1)).toEqual([])
    expect(notesBetween(2, 1)).toEqual([])
  })

  it('takes the start of the window in and leaves its end out', () => {
    expect(notesBetween(0.125, 0.25).map(({ time }) => time)).toEqual([0.125])
  })

  it('neither repeats nor drops a strike across back-to-back windows', () => {
    const whole = notesBetween(0, RING_LOOP * 3)
    const windows = Array.from({ length: (RING_LOOP * 3) / 0.25 }, (_, index) =>
      notesBetween(index * 0.25, (index + 1) * 0.25),
    )
    expect(windows.flat()).toEqual(whole)
  })

  it('repeats the phrase every loop, with a pause after it', () => {
    const first = notesBetween(0, RING_LOOP)
    const third = notesBetween(RING_LOOP * 2, RING_LOOP * 3)
    expect(third).toEqual(first.map((note) => ({ ...note, time: note.time + RING_LOOP * 2 })))
    expect(RING_LOOP - Math.max(...first.map(({ time }) => time))).toBeGreaterThan(1)
  })
})
