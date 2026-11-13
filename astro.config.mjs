// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// Google Fonts' "latin" unicode-range (also used by @fontsource), so each face is applied to
// exactly the same characters as with the original Google Fonts stylesheet.
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

/**
 * Latin-subset woff2 faces from an installed @fontsource package.
 * @param {string} pkg  e.g. "titillium-web"
 * @param {[number, ...number[]]} weights
 */
const fontsourceLatin = (pkg, [first, ...rest]) => {
  /** @param {number} weight */
  const variant = (weight) => ({
    weight,
    style: /** @type {const} */ ("normal"),
    src: /** @type {[string]} */ ([`@fontsource/${pkg}/files/${pkg}-latin-${weight}-normal.woff2`]),
    unicodeRange: /** @type {[string]} */ ([LATIN]),
  });
  /** @type {[ReturnType<typeof variant>, ...ReturnType<typeof variant>[]]} */
  const variants = [variant(first), ...rest.map(variant)];
  return { variants };
};

// Fully static build: no adapter, no client JS. `dist/` is served as-is by an
// assets-only Cloudflare Worker (see wrangler.jsonc).
export default defineConfig({
  site: "https://junction2026.com",
  output: "static",

  // URL shape: /about served from about.html, no trailing slash. This matches
  // `html_handling: "drop-trailing-slash"` in wrangler.jsonc.
  trailingSlash: "never",
  build: {
    format: "file",
    // The stylesheet is a few KB: inline it so there is no render-blocking CSS request.
    inlineStylesheets: "always",
  },

  devToolbar: { enabled: false },

  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      // Encoder flags for the hero image (per-format quality is set in src/pages/index.astro).
      // The thin green lines in the hero need full-resolution chroma (4:4:4 AVIF, smart
      // subsampling for WebP) to stay crisp. Higher AVIF effort saved only ~2-3% for 3-10x
      // the encode time, so sharp's default (4) is kept.
      // NOTE: these options are NOT part of Astro's output filename hash or its image cache
      // key. If you change them, delete node_modules/.astro/ before building, and also change
      // a hashed prop (e.g. quality) so the immutable-cached URLs change too.
      config: {
        avif: { effort: 4, chromaSubsampling: "4:4:4" },
        webp: { effort: 6, smartSubsample: true },
        jpeg: { mozjpeg: true },
      },
    },
  },

  // Self-hosted fonts: woff2 files from the installed @fontsource packages, copied into
  // dist/_astro/fonts/ with hashed names. Nothing is fetched over the network at build or
  // run time. Astro also generates metric-matched fallback faces to cut layout shift on swap.
  // (Titillium Web 900 was requested by the original but never used, so it is not included.)
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Titillium Web",
      cssVariable: "--font-titillium-web",
      display: "swap",
      fallbacks: ["sans-serif"],
      options: fontsourceLatin("titillium-web", [300, 400, 600, 700]),
    },
    {
      provider: fontProviders.local(),
      name: "Space Mono",
      cssVariable: "--font-space-mono",
      display: "swap",
      fallbacks: ["monospace"],
      // Keep the plain `"Space Mono", monospace` stack of the original. The hero button's
      // "→" (U+2192) is in no Space Mono subset, so the original draws it with the generic
      // monospace font; a generated fallback face (local Courier New, no unicode-range) would
      // draw it differently. Monospace fallbacks are already within ~2% of Space Mono's width.
      optimizedFallbacks: false,
      options: fontsourceLatin("space-mono", [400, 700]),
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
