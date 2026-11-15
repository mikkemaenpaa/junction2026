import { memo, useEffect, useMemo, useRef, useState } from 'react'

/**
 * The wall of 💀 in the red of the error flash for the skull ask (SKULL_ASK, Hero.tsx): staggered
 * rows of skulls, each a little off its place and tilted, mostly of one size with some small and
 * some large ones, and here and there a giant. Lengths are in the usual skull's size (`size`), so
 * screens of every size show the same arrangement around the centre, each at its own scale.
 */
export const WALL = {
  /** The usual skull's font size: `perSide` times the square root of the wall's area (42px on
      1440 x 900), so every larger screen holds about as many skulls, some 250; never under `min`
      px, which phones get. */
  size: { min: 36, perSide: 0.037 },
  /** Staggered rows: from one skull to the next in a row, and from one row to the next. */
  pitch: { x: 1.8, y: 1.52 },
  /** How far a skull strays from its place, at most, as a share of the pitch either way. */
  jitter: 0.22,
  /** How far a skull tilts, at most, in degrees either way. */
  tilt: 24,
  /** The share of small and of large skulls, and their size relative to the usual one. */
  small: { share: 0.16, scale: 0.62 },
  large: { share: 0.05, scale: 1.45 },
  /** The rows are cut into blocks of cells; `share` of the blocks get a giant near their middle.
      The skulls under a giant make room for it. */
  giant: { block: { x: 6, y: 5 }, share: 0.4, scale: { min: 3.4, max: 5.4 } },
  /** Picked by eye: two giants flank the orb. */
  seed: 16,
} as const

export type Skull = {
  /** The centre, in px from the wall's centre. */
  x: number
  y: number
  /** Font size, px. */
  size: number
  /** Degrees, clockwise. */
  tilt: number
}

/**
 * A random sequence of its own for each cell of the skulls' grid (`grid` 0) or block of the giants'
 * (`grid` 1): mulberry32 seeded from the cell. A cell holds the same skull however large the wall,
 * so the arrangement never reshuffles from one screen size to another.
 */
function cellRandom(grid: number, i: number, j: number) {
  let state = Math.imul(WALL.seed + grid, 0x9e3779b1) ^ Math.imul(i, 0x85ebca6b) ^ Math.imul(j, 0xc2b2ae35)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const between = (random: number, min: number, max: number) => min + random * (max - min)
const either = (random: number, max: number) => (random * 2 - 1) * max
const round = ({ x, y, size, tilt }: Skull): Skull => ({
  x: Math.round(x),
  y: Math.round(y),
  size: Math.round(size),
  tilt: Math.round(tilt),
})

/** The skulls that show on a wall of `width` x `height` px, giants last (on top). */
export function skullWall(width: number, height: number): Skull[] {
  const { size, pitch, jitter, tilt, small, large, giant } = WALL
  const unit = Math.round(Math.max(size.min, Math.sqrt(width * height) * size.perSide))
  const dx = pitch.x * unit
  const dy = pitch.y * unit
  const shows = (skull: Skull) =>
    Math.abs(skull.x) - skull.size / 2 < width / 2 && Math.abs(skull.y) - skull.size / 2 < height / 2

  const giants: Skull[] = []
  const bw = giant.block.x * dx
  const bh = giant.block.y * dy
  const blocksX = Math.ceil(width / 2 / bw) + 1
  const blocksY = Math.ceil(height / 2 / bh) + 1
  for (let J = -blocksY; J < blocksY; J++)
    for (let I = -blocksX; I < blocksX; I++) {
      const random = cellRandom(1, I, J)
      if (random() >= giant.share) continue
      giants.push(
        round({
          x: (I + between(random(), 0.2, 0.8)) * bw,
          y: (J + between(random(), 0.2, 0.8)) * bh,
          size: unit * between(random(), giant.scale.min, giant.scale.max),
          tilt: either(random(), tilt),
        }),
      )
    }

  const skulls: Skull[] = []
  // Two cells past each edge: a skull never strays further than that from its cell.
  const cols = Math.ceil(width / 2 / dx) + 2
  const rows = Math.ceil(height / 2 / dy) + 2
  for (let j = -rows; j <= rows; j++)
    for (let i = -cols; i <= cols; i++) {
      const random = cellRandom(0, i, j)
      const x = (i + (j & 1) / 2 + either(random(), jitter)) * dx
      const y = (j + either(random(), jitter)) * dy
      const kind = random()
      const scale = kind < small.share ? small.scale : kind >= 1 - large.share ? large.scale : 1
      const skull = round({ x, y, size: unit * scale, tilt: either(random(), tilt) })
      if (shows(skull) && giants.every((g) => Math.hypot(g.x - x, g.y - y) >= g.size / 2)) skulls.push(skull)
    }

  return [...skulls, ...giants.filter(shows)]
}

// The wall is laid out for its size rounded up to whole steps, so resizing the window lays it out
// anew only every so often.
const STEP = 100

/**
 * The wall, laid out once it is on the page and knows its size (it first renders empty). Hero.tsx
 * mounts it in the red layer as the skull ask is made; the layer gives it its opacity, `aria-hidden`
 * and `pointer-events: none`.
 */
export const SkullWall = memo(function SkullWall() {
  const wall = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ width: number; height: number }>()
  useEffect(() => {
    const element = wall.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.ceil(entry.contentRect.width / STEP) * STEP
      const height = Math.ceil(entry.contentRect.height / STEP) * STEP
      setBox((current) => (current?.width === width && current.height === height ? current : { width, height }))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const skulls = useMemo(() => (box ? skullWall(box.width, box.height) : []), [box])

  return (
    <div ref={wall} className="skull-wall">
      {skulls.map(({ x, y, size, tilt }, index) => (
        <span
          key={index}
          style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, fontSize: size, rotate: `${tilt}deg` }}
        >
          💀
        </span>
      ))}
    </div>
  )
})
