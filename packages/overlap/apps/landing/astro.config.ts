import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, fontProviders } from 'astro/config'

// Google Fonts' "latin" unicode-range (also used by @fontsource), so each face covers exactly the
// characters of the latin subset file.
const LATIN =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'

// Fully static build: no adapter. `dist/` is served as-is by an assets-only Cloudflare Worker
// (see wrangler.jsonc). React is only used for islands.
export default defineConfig({
  // The public origin, for canonical and Open Graph URLs. No domain is decided yet: build with
  // SITE_URL=https://example.com to emit them (BaseLayout omits them while it is unset).
  site: process.env.SITE_URL || undefined,
  output: 'static',

  // URL shape: /about served from about.html, no trailing slash. This matches
  // `html_handling: "auto-trailing-slash"` in wrangler.jsonc, which serves .html files without a
  // trailing slash (and the app's dist/app/index.html, which is not an Astro page, at /app/).
  trailingSlash: 'never',
  build: {
    format: 'file',
    // One page: inline the stylesheet so there is no render-blocking CSS request.
    inlineStylesheets: 'always',
  },

  devToolbar: { enabled: false },

  integrations: [react()],

  // Self-hosted fonts: woff2 files from the installed @fontsource packages, copied into
  // dist/_astro/fonts/ with hashed names. Nothing is fetched over the network at build or run
  // time. Astro also generates metric-matched fallback faces to cut layout shift on swap.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      display: 'swap',
      fallbacks: ['sans-serif'],
      options: {
        // One variable file with the optical size (opsz 12-96) and weight (200-800) axes; the
        // design uses 500, 700 and 800. Browsers pick the optical size from the font size.
        variants: [
          {
            weight: '200 800',
            style: 'normal',
            src: ['@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2'],
            unicodeRange: [LATIN],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'DM Sans',
      cssVariable: '--font-dm-sans',
      display: 'swap',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2'],
            unicodeRange: [LATIN],
          },
          {
            weight: 500,
            style: 'normal',
            src: ['@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2'],
            unicodeRange: [LATIN],
          },
          {
            weight: 700,
            style: 'normal',
            src: ['@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2'],
            unicodeRange: [LATIN],
          },
        ],
      },
    },
    {
      // The skull of the hero's error flash (SkullWall.tsx) for devices with no emoji font of their
      // own. It comes last in the wall's font stack (hero.css) and covers U+1F480 alone, so the
      // browser only fetches it where no font before it has the skull, and only once the wall is on
      // the page, from the skull ask on (SKULL_ASK in src/data/events.ts). Not preloaded for that
      // reason.
      // One glyph of Noto Color Emoji 2.057 (googlefonts/noto-emoji, 2D/fonts/Noto-COLRv1.ttf; SIL
      // OFL 1.1, see OFL.txt beside it), cut with fonttools: `pyftsubset Noto-COLRv1.ttf
      // --unicodes=U+1F480 --layout-features='' --no-hinting --name-IDs=0,1,2,3,4,5,6,7,13,14
      // --flavor=woff2`.
      provider: fontProviders.local(),
      name: 'Noto Skull',
      cssVariable: '--font-skull',
      // Invisible rather than a box if it is still on its way, but it arrives while the ask is still
      // thinking and searching, before its flash.
      display: 'block',
      fallbacks: [],
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['./src/assets/fonts/noto-emoji-skull.woff2'],
            unicodeRange: ['U+1F480'],
          },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
})
