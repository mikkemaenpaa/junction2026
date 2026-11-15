// The 1200x630 social image (Open Graph / Twitter card), rendered at build time. See src/cards/.
import type { APIRoute } from 'astro'
import { renderOgImage } from '@/cards/render'

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderOgImage()), { headers: { 'Content-Type': 'image/png' } })
