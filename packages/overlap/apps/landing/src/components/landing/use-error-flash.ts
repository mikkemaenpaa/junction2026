import { useEffect, useRef, type RefObject } from 'react'
import type { AskPhase } from './use-ask-flow'

/**
 * The flash for an ask that fits nothing: as the orb shows its X, the hero's background pulses red
 * and the scene leans in towards the orb by a hair, then both settle back.
 */
export const FLASH = {
  color: '#ff0000',
  /** Milliseconds: fully red by `attack`, held until `hold`, gone by `duration`. */
  attack: 80,
  hold: 300,
  duration: 750,
  /** The scene's scale at `hold`, reached and left with ease-in-out. */
  zoom: 1.015,
  /** Reduced motion: no zoom, only a soft tint that rises over `rise` and is gone by `duration`. */
  reduced: { opacity: 0.18, rise: 250, duration: 900 },
  /** WCAG 2.3.1: never two flashes within this many milliseconds, however fast the errors come. */
  interval: 1000,
} as const

/** Whether a flash may start at `now` when the previous one started at `last` (both in ms). */
export const mayFlash = (last: number, now: number) => now - last >= FLASH.interval

/** One flash: the red layer's opacity and the scene's scale (none under reduced motion). */
export function flashTimeline(reduced: boolean): { duration: number; tint: Keyframe[]; zoom: Keyframe[] | null } {
  if (reduced) {
    const { opacity, rise, duration } = FLASH.reduced
    return {
      duration,
      tint: [
        { opacity: 0, easing: 'ease-in-out' },
        { opacity, offset: rise / duration, easing: 'ease-in-out' },
        { opacity: 0 },
      ],
      zoom: null,
    }
  }
  const { attack, hold, duration, zoom } = FLASH
  return {
    duration,
    tint: [
      { opacity: 0, easing: 'ease-out' },
      { opacity: 1, offset: attack / duration },
      { opacity: 1, offset: hold / duration, easing: 'ease-in-out' },
      { opacity: 0 },
    ],
    zoom: [
      { scale: 1, easing: 'ease-in-out' },
      { scale: zoom, offset: hold / duration, easing: 'ease-in-out' },
      { scale: 1 },
    ],
  }
}

/**
 * Flashes `layer` (the red) and zooms `scene` once each time the ask flow enters `error`. Web
 * Animations rather than a class: each flash is a new animation, so there is nothing to reset
 * between two, and opacity and scale run on the compositor. A finished animation leaves no style
 * behind.
 */
export function useErrorFlash(
  phase: AskPhase,
  layer: RefObject<HTMLElement | null>,
  scene: RefObject<HTMLElement | null>,
) {
  const last = useRef(-Infinity)
  useEffect(() => {
    if (phase !== 'error' || !layer.current || !scene.current) return
    const now = performance.now()
    if (!mayFlash(last.current, now)) return
    last.current = now
    const { duration, tint, zoom } = flashTimeline(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    layer.current.animate(tint, duration)
    if (zoom) scene.current.animate(zoom, duration)
  }, [phase, layer, scene])
}
