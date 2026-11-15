// Fonts for the build-time card images (satori). Satori needs static TTF/OTF/WOFF faces, so these
// are the per-weight WOFF files of the @fontsource packages the page already uses (the page itself
// loads the variable Bricolage woff2 through Astro's Fonts API). The files are resolved through
// each package's `exports` map, so this works under pnpm's layout and from Astro's build chunks.
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import type { Font } from 'satori'

/** Font family names as used in the card styles. */
export const DISPLAY = 'Bricolage'
export const TEXT = 'DM Sans'

const FACES = [
  {
    name: DISPLAY,
    weight: 500,
    file: '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff',
  },
  {
    name: DISPLAY,
    weight: 700,
    file: '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff',
  },
  {
    name: DISPLAY,
    weight: 800,
    file: '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff',
  },
  { name: TEXT, weight: 400, file: '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff' },
  { name: TEXT, weight: 500, file: '@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff' },
  { name: TEXT, weight: 700, file: '@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff' },
] as const

let fonts: Promise<Font[]> | undefined

/** The card fonts, read once per process. */
export function loadFonts(): Promise<Font[]> {
  if (!fonts) {
    const require = createRequire(import.meta.url)
    fonts = Promise.all(
      FACES.map(async ({ name, weight, file }) => ({
        name,
        weight,
        style: 'normal' as const,
        data: await readFile(require.resolve(file)),
      })),
    )
    // A failed read must not be cached for the rest of the build.
    fonts.catch(() => (fonts = undefined))
  }
  return fonts
}
