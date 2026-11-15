// Build-time image pipeline: satori (React elements -> SVG, text as paths) -> resvg (PNG) -> sharp.
// Everything is deterministic: the same element and options give the same bytes.
import { Resvg } from '@resvg/resvg-js'
import type { ReactNode } from 'react'
import satori from 'satori'
import sharp from 'sharp'
import { EVENTS, EVENT_IMAGE_DENSITY, EVENT_SHAPES, type LandingEvent } from '@/data/events'
import { EventCard, LAYOUTS } from './EventCard'
import { loadFonts } from './fonts'
import { OG_HEADLINE, OG_HEADLINE_BOX, OG_SIZE, OgImage } from './OgImage'
import { fitTitle } from './title'

type Size = { width: number; height: number }

/** Renders an element laid out at `size` to PNG, at `density` output pixels per layout pixel. */
export async function renderPng(element: ReactNode, { width, height }: Size, density = 1): Promise<Buffer> {
  const svg = await satori(element, { width, height, fonts: await loadFonts() })
  // Text is already paths, so resvg needs no fonts of its own.
  const resvg = new Resvg(svg, {
    fitTo: density === 1 ? { mode: 'original' } : { mode: 'width', value: Math.round(width * density) },
    font: { loadSystemFonts: false },
  })
  return resvg.render().asPng()
}

/** The card element of an event, with its title fitted to the card's shape. */
export async function eventCardElement(event: LandingEvent) {
  const title = await fitTitle(event.title, LAYOUTS[event.shape].title)
  // Every other card of a shape (in data order) has its motif mirrored.
  const mirror =
    EVENTS.filter((other) => other.shape === event.shape).findIndex((other) => other.id === event.id) % 2 === 1
  return EventCard({ event, title, mirror })
}

/**
 * WebP settings. The cards are flat colour and text: lossy WebP with sharp's YUV conversion keeps
 * coloured type crisp at a fraction of the lossless size.
 */
const WEBP = { quality: 82, effort: 6, smartSubsample: true } as const

/** The event's card image as WebP: its shape's layout size times EVENT_IMAGE_DENSITY. */
export async function renderEventCard(event: LandingEvent): Promise<Buffer> {
  const png = await renderPng(await eventCardElement(event), EVENT_SHAPES[event.shape], EVENT_IMAGE_DENSITY)
  return sharp(png).webp(WEBP).toBuffer()
}

/** Events in the social image's fan: back left, back right, front. */
const OG_FAN = ['growth-brand-panel', 'climate-data-jam', 'spring-tech-design-fair'] as const

/** The 1200x630 social image as PNG. */
export async function renderOgImage(): Promise<Buffer> {
  const cards = await Promise.all(
    OG_FAN.map(async (id) => {
      const event = EVENTS.find((candidate) => candidate.id === id)
      if (!event) throw new Error(`[cards] The social image's fan names an unknown event: ${id}`)
      const size = EVENT_SHAPES[event.shape]
      const png = await renderPng(await eventCardElement(event), size)
      return { src: `data:image/png;base64,${png.toString('base64')}`, ...size }
    }),
  )
  const headline = await fitTitle(OG_HEADLINE, OG_HEADLINE_BOX)
  const png = await renderPng(OgImage({ headline, cards }), OG_SIZE)
  // A 256-colour palette is plenty for flat colour and anti-aliased type, at a third of the size.
  return sharp(png).png({ palette: true, quality: 100, effort: 10, compressionLevel: 9 }).toBuffer()
}
