// Colours and per-tone colourways of the card images. Only the Overlap palette (the app's theme in
// apps/app/src/index.css, mirrored in src/styles/global.css), the app's fit-ring scale and its
// avatar tints are used.
import type { EventTone } from '@/data/events'

export const PALETTE = {
  paper: '#f5f1ea',
  card: '#fffdf9',
  ink: '#11201c',
  mute: '#6b7a74',
  line: '#e3ddd1',
  forest: '#0e3b33',
  lime: '#d9f26b',
  coral: '#ff7a59',
  good: '#1f9d6b',
  white: '#ffffff',
} as const

/** A colour with an opacity, so it can be written both as CSS `rgba()` and as SVG paint + opacity. */
export type Paint = { hex: string; alpha: number }

const paint = (hex: string, alpha = 1): Paint => ({ hex, alpha })

/** CSS colour of a paint. Satori keeps comma-separated `rgba()` as is. */
export function css({ hex, alpha }: Paint): string {
  if (alpha >= 1) return hex
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

/** A paint flattened onto an opaque background, so decoration behind it does not show through. */
export function over({ hex, alpha }: Paint, background: string): Paint {
  const top = Number.parseInt(hex.slice(1), 16)
  const base = Number.parseInt(background.slice(1), 16)
  const channel = (shift: number) =>
    Math.round(((top >> shift) & 255) * alpha + ((base >> shift) & 255) * (1 - alpha))
      .toString(16)
      .padStart(2, '0')
  return { hex: `#${channel(16)}${channel(8)}${channel(0)}`, alpha: 1 }
}

/** The app's fit-ring scale (apps/app/src/ui.tsx, `Ring`). */
export const fitColor = (fit: number) =>
  fit >= 80 ? '#1f9d6b' : fit >= 65 ? '#6aa84f' : fit >= 50 ? '#e0a526' : '#e5654a'

/** The app's avatar tints (apps/app/src/ui.tsx, `Avatar`). */
export const avatarColors = (hue: number) => ({
  background: `hsl(${hue}, 55%, 88%)`,
  color: `hsl(${hue}, 60%, 22%)`,
})

export type Colourway = {
  background: string
  /** A thin keyline inside the edge, for the light colourway that would otherwise melt into the page. */
  keyline?: string
  title: string
  text: Paint
  /** Tag and ring track are opaque (flattened with `over`): the motif may pass behind them. */
  tag: { background: Paint; color: string }
  ring: { track: Paint; stroke: (fit: number) => string; number: string }
  /** Hairline between the details and the footer. */
  rule: Paint
  /** The decorative motif, after the logo: a filled circle overlapped by an outlined one. */
  motif: { fill: Paint; line: Paint }
}

const { paper, card, ink, mute, line, forest, lime, coral, white } = PALETTE

export const COLOURWAYS: Record<EventTone, Colourway> = {
  forest: {
    background: forest,
    title: white,
    text: paint(white, 0.72),
    tag: { background: paint(lime), color: forest },
    ring: { track: over(paint(white, 0.18), forest), stroke: () => lime, number: white },
    rule: paint(white, 0.14),
    motif: { fill: paint(white, 0.06), line: paint(lime, 0.3) },
  },
  card: {
    background: card,
    keyline: line,
    title: ink,
    text: paint(mute),
    tag: { background: over(paint(ink, 0.07), card), color: ink },
    ring: { track: paint(line), stroke: fitColor, number: ink },
    rule: paint(line),
    motif: { fill: paint(paper), line: paint(line) },
  },
  lime: {
    background: lime,
    title: forest,
    text: paint(forest),
    tag: { background: paint(forest), color: lime },
    ring: { track: over(paint(forest, 0.16), lime), stroke: () => forest, number: forest },
    rule: paint(forest, 0.16),
    motif: { fill: paint(white, 0.3), line: paint(forest, 0.2) },
  },
  coral: {
    background: coral,
    title: ink,
    text: paint(ink, 0.72),
    tag: { background: paint(ink), color: card },
    ring: { track: over(paint(ink, 0.16), coral), stroke: () => ink, number: ink },
    rule: paint(ink, 0.14),
    motif: { fill: paint(white, 0.16), line: paint(ink, 0.2) },
  },
  ink: {
    background: ink,
    title: paper,
    text: paint(paper, 0.68),
    tag: { background: over(paint(white, 0.14), ink), color: paper },
    ring: { track: over(paint(white, 0.16), ink), stroke: () => coral, number: paper },
    rule: paint(white, 0.12),
    motif: { fill: paint(white, 0.05), line: paint(coral, 0.3) },
  },
}
