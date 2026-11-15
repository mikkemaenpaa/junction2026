// The event card images the hero's depth field loads (`eventImage(event)`): one WebP per event,
// rendered at build time at its shape's pixel size. See src/cards/.
import type { APIRoute, GetStaticPaths } from 'astro'
import { renderEventCard } from '@/cards/render'
import { EVENTS, type LandingEvent } from '@/data/events'

export const getStaticPaths = (() =>
  EVENTS.map((event) => ({ params: { id: event.id }, props: { event } }))) satisfies GetStaticPaths

export const GET: APIRoute<{ event: LandingEvent }> = async ({ props }) =>
  new Response(new Uint8Array(await renderEventCard(props.event)), { headers: { 'Content-Type': 'image/webp' } })
