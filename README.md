# Junction 2026

The website for Junction 2026 at [junction2026.com](https://junction2026.com): the home page
(hero plus a card for every challenge), all challenges (a listing plus one page per
challenge), event info, a 404 page and a generated `sitemap.xml`.

- Static [Astro](https://astro.build) site styled with Tailwind CSS v4.
- Zero client-side JavaScript. The only `<script>` tags are inert data blocks (speculation
  rules for prefetching, and JSON-LD on the home page).
- No third-party requests: fonts, images and partner logos are all self-hosted.
- Deployed as an assets-only Cloudflare Worker. There is no Worker script; Cloudflare serves
  the files in `dist/` directly (see `wrangler.jsonc`).

## Prerequisites

- Node.js 22.23.4 or newer (see `engines` in `package.json`) and npm.

## Commands

```sh
npm install      # install dependencies
npm run dev      # dev server with live reload at http://localhost:4321
npm run build    # build the static site into dist/
npm run preview  # build, then serve dist/ locally with wrangler as on Cloudflare
                 # (headers from public/_headers, the 404 page, URLs without trailing slash)
npm run check    # type-check the project
npm run deploy   # build, then deploy to Cloudflare
```

### Deploying

`npm run deploy` runs `wrangler deploy`. Wrangler needs `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in the environment, or a session from `wrangler login`.
Never commit credentials to this repository.

A deploy uploads the contents of `dist/` as the static assets of the `junction2026` Worker
(only changed files are sent) and serves them on the `junction2026.com` custom domain set in
`wrangler.jsonc`. The new version is live as soon as the command finishes; rolling back means
redeploying an earlier commit or using Cloudflare's version history for the Worker.

## Where things live

| What | Where |
| --- | --- |
| Tracks, challenges, tech challenges, partners, event timeline | `src/data/challenges.ts` |
| Challenge URL slugs (`/challenges/<slug>`) | `src/data/challenge-directory.ts` |
| Partner logos | `src/data/partner-logos.ts` and `src/assets/partner-logos/` |
| Pages | `src/pages/` (`index`, `challenges`, `challenges/[slug]`, `about`, `404`) |
| Sitemap (generated from the challenge data) | `src/pages/sitemap.xml.ts` |
| Crawler rules | `public/robots.txt` |
| Shared components and layout | `src/components/`, `src/layouts/BaseLayout.astro` |
| Theme and styles | `src/styles/global.css` |
| Fonts and image encoder settings | `astro.config.mjs` |
| Cache and security headers | `public/_headers` |
| Cloudflare configuration | `wrangler.jsonc` |

## Updating content

Edit the files above and run `npm run build` (or keep `npm run dev` running) to check the
result, then deploy. Challenge text, prizes and links live in `src/data/challenges.ts`; the
home page cards, the `/challenges` listing, the detail pages and `sitemap.xml` are all built
from it, so a new challenge appears everywhere at once. Event info (schedule and FAQ) is in
`src/data/challenges.ts` (`timeline`) and `src/pages/about.astro`.

Each challenge gets its own page automatically. The slug is built from the organisation and
the title, so changing either one changes the challenge's URL. The build fails if two
challenges end up with the same slug.

## Adding a partner logo

1. Put the file in `src/assets/partner-logos/`. Use an SVG if you have one. Run it through
   [SVGO](https://svgo.dev) first, keep its `viewBox`, and check that it contains no scripts,
   event handlers or external references. If the logo only exists as a bitmap, use a WebP or
   PNG with a transparent background, about 500 px wide at most. Logos are shown at up to
   162×56 px.
2. Import the file in `src/data/partner-logos.ts` and add an entry keyed by the challenge's
   exact `org` name. Set `dark: true` if the logo needs a dark surface, for example a white
   logo.
3. Run `npm run build`. The logo is copied to `/_astro/` with a content hash in its file
   name, so it can be cached forever. Logos are only ever shown with `<img>`.
