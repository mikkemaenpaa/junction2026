# Junction 2026

The website for Junction 2026 at [junction2026.com](https://junction2026.com): the home page
(hero plus a card for every challenge), all challenges (a listing plus one page per
challenge), event info, a 404 page and a generated `sitemap.xml`. For AI agents and crawlers,
every page also has a Markdown version, indexed by `llms.txt` (see
[Markdown for AI agents](#markdown-for-ai-agents)).

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
| `llms.txt` (generated from the challenge data) | `src/pages/llms.txt.ts` |
| Markdown twins of the pages and `llms-full.txt` | `src/integrations/markdown-twins.ts` |
| Crawler rules and AI content signals | `public/robots.txt` |
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

## Markdown for AI agents

Following [Cloudflare's docs site](https://developers.cloudflare.com/), the site offers a
plain Markdown version of its content for AI agents, all as static files:

| URL | What |
| --- | --- |
| `/index.md`, `/challenges.md`, `/about.md`, `/challenges/<slug>.md` | Markdown twin of the page at the same URL without `.md` (the home page's is `/index.md`). The 404 page has none. |
| `/llms.txt` | Index of the site in the [llms.txt](https://llmstxt.org) format: key facts, then links to every twin, with the challenges grouped by track. |
| `/llms-full.txt` | All twins in one file, in `llms.txt` order. |

- **Twins are generated, never written by hand.** After `astro build`, the integration in
  `src/integrations/markdown-twins.ts` (`astro:build:done` hook) converts the `<main>` of
  every built HTML page to Markdown with unified (rehype-parse, rehype-remark,
  remark-stringify; dev dependencies only). It first reshapes the HTML so it reads well as
  Markdown: header, footer, navigation, images, icons and hidden elements are dropped;
  challenge cards become a heading with a link on the title followed by plain text;
  `<details>` sections are expanded; rows of links become lists; links become absolute URLs
  of the normal pages (`https://junction2026.com/...`, no `.md`). A new page therefore gets a
  twin automatically. Each twin starts with YAML front matter (`title` and `description` from
  the page's `<title>` and meta description, `url`), a one-line note pointing to `llms.txt`,
  and the page's `# H1`.
- **Each page announces its twin** with `<link rel="alternate" type="text/markdown">` in
  `src/layouts/BaseLayout.astro` (`markdown={false}` turns it off, as on the 404 page).
- **`llms.txt` is generated from the challenge data** (`src/pages/llms.txt.ts`), like the
  sitemap, so it cannot drift from the challenges. Its key facts and the three page
  descriptions are written in that file.
- **The build fails** if a page has no `<main>`, its `<link rel="alternate">` does not match its
  twin, a twin contains leftover HTML, an empty or a relative link, a twin is missing from
  `llms.txt`, or `llms.txt` links to a file that was not built. If you add a page, add it to the
  "Pages" list in `src/pages/llms.txt.ts`.
- Twins exist only in `dist/` after `npm run build` (or `npm run preview`), not in `npm run dev`.
- `public/_headers` serves `.md` files as `text/markdown; charset=utf-8` and the llms files as
  `text/plain; charset=utf-8`, and sends `Vary: Accept` on everything except `/_astro/*`.
- `public/robots.txt` allows all crawlers and states Cloudflare's
  [content signals](https://contentsignals.org) `ai-train=yes, search=yes, ai-input=yes`, in a
  single `User-agent: *` group: a crawler reads only the most specific group that matches it,
  so adding a group for one bot would need the `Content-Signal` line repeated in it. The
  sitemap lists only the HTML pages.

### Content negotiation (Cloudflare zone rules)

On Cloudflare's docs, a request with `Accept: text/markdown` gets the Markdown version of the
page. This site has no Worker code, so two URL rewrite rules (Rules > Transform Rules > URL
Rewrite Rules) on the `junction2026.com` zone do the same by rewriting the path to the twin.
They are not part of this repository or of a deploy; to reproduce them, create:

| Rule | When incoming requests match (expression) | Rewrite path to (dynamic) |
| --- | --- | --- |
| Markdown for the home page | `(http.request.uri.path eq "/" and any(http.request.headers["accept"][*] contains "text/markdown"))` | `/index.md` (static) |
| Markdown for other pages | `(http.request.uri.path ne "/" and http.request.uri.path.extension eq "" and not ends_with(http.request.uri.path, "/") and any(http.request.headers["accept"][*] contains "text/markdown"))` | `concat(http.request.uri.path, ".md")` |

With the rules on, `curl -H "Accept: text/markdown" https://junction2026.com/about` returns
`/about.md`. A path without a twin (an unknown page) then gets the 404 page, as without the
header. `Vary: Accept` keeps browser and other caches from mixing up the two versions.

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
