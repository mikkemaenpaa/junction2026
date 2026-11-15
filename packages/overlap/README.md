# Overlap

Overlap matches talent and companies to events by a fit rating. This repository is a pnpm
workspace on the [Vite+](https://viteplus.dev) toolchain (`vp`) with two apps:

| Path           | Package            | What                                                                                                            |
| -------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| `apps/app`     | `@overlap/app`     | The web app: React 19, Vite, Tailwind CSS v4. Built and hosted by Figma Make (`.figma/`).                       |
| `apps/landing` | `@overlap/landing` | The landing page: Astro 7 (static), React islands, Tailwind CSS v4. Served by an assets-only Cloudflare Worker. |

`scripts/build-site.mjs` combines the two into one deployable site: the landing page at `/` and
the app at `/app/`.

## Commands

Node.js 22.23.4+ (Astro 7's minimum) and pnpm 10.34.3 (pinned in `.mise.toml` and
`packageManager`). With the
[global `vp` CLI](https://viteplus.dev/guide/global-cli):

```sh
vp install              # install the whole workspace
vp run dev              # app dev server, http://localhost:8443 ($PORT overrides)
vp run dev:landing      # landing, http://localhost:4321, and pre-selection, http://localhost:4322
vp run build            # build both apps on their own (vp run -r build)
vp run build:site       # build the composed site into apps/landing/dist (see below)
vp test                 # unit tests (Vitest)
vp check                # format check, lint and type check of the whole workspace
vp run check            # astro check of the landing page + vp check + vp test
vp fmt                  # format
vp run deploy:landing   # build the composed site and deploy it
```

Without the global CLI, use `pnpm install` and `pnpm run <script>` (`pnpm test` for the tests);
the scripts call the project-local `vp`. Per app: `vp run --filter @overlap/landing <script>`
(`dev`, `build`, `preview`, `deploy`, `check`) or `vp run --filter @overlap/app <script>` (`dev`,
`build`, `preview`). `vp dev` and `vp build` are Vite+ built-ins that ignore package scripts, so
the Astro app is always started through `vp run`. On a fresh clone, `vp check` reports type errors
in the landing page until an Astro command has generated `apps/landing/.astro/`; `vp run check`
runs `astro check` first for that reason.

## The pre-selection app

`apps/preselect` (`@overlap/preselect`) is a third app that runs on its own: applicant
pre-selection for an event, on Astro 7 with a Node server. It is not part of the composed site.

```sh
pnpm install
cp apps/preselect/.env.example apps/preselect/.env   # then put the Context.dev API key in it
pnpm --filter @overlap/preselect run dev             # http://localhost:4322
```

The organiser view is empty at first: the collected applicant data is not in the repository.
See [apps/preselect/README.md](apps/preselect/README.md) for the scripts that collect it.

`pnpm run dev:landing` starts this app next to the landing page, and the landing page's ask box
passes a public profile on to it (`PRESELECT_URL` in `apps/landing/src/config.ts`,
http://localhost:4322 in development). The profile is read and scored for the organiser; the
visitor is told which companies at the event it matches. A build sends profiles only when
`PUBLIC_PRESELECT_URL` is set. A deployed site would also need the backend's origin in
the landing page's `connect-src` (`apps/landing/public/_headers`) and its own origin in the
backend's `PRESELECT_ALLOWED_ORIGINS`; neither is set up.

## The composed site

`vp run build:site` (or `pnpm run build:site`) runs `scripts/build-site.mjs`:

1. builds `apps/app` with `APP_BASE=/app/`, so its URLs start with `/app/`;
2. builds `apps/landing` (`astro build` empties `apps/landing/dist` first);
3. copies `apps/app/dist` to `apps/landing/dist/app`.

`APP_BASE` (default `/`) only applies when `FIGMA_PUBLIC_URL` is unset, so Figma Make builds of
the app are unchanged. The landing page's "Get started" buttons go to `/get-started`
(`GET_STARTED_URL`), a login-style page whose "Log in" opens the platform (`PLATFORM_URL`): the
pre-selection app's organiser view when it runs (`PRESELECT_URL`), else the app at `/app/`
(`APP_URL`). All four are in `apps/landing/src/config.ts`.

Set `PUBLIC_APP_URL` to open an app deployed elsewhere instead; `build:site` then skips the app.
When the platform is on another origin (`PUBLIC_PRESELECT_URL`, else `PUBLIC_APP_URL`),
`build:site` adds that origin to the landing page's `form-action` CSP directive in `dist/_headers`
(the "Log in" form on `/get-started` submits a GET form to it).

`apps/landing/wrangler.jsonc` defines an assets-only Worker (`overlap-landing`: no Worker code, no
bindings) that serves `apps/landing/dist`:

- `html_handling: "auto-trailing-slash"`: landing pages without a trailing slash (`/about` from
  `about.html`), folders with one. `/app` redirects to `/app/`, where the app's relative URLs
  (`manifest.webmanifest`, `icon.svg`) and its service worker scope (`/app/`) resolve.
- `not_found_handling: "404-page"`: unknown paths, also under `/app/`, get the landing page's
  `404.html` with a 404 status.
- `apps/landing/public/_headers`: security headers and caching. The landing page's
  Content-Security-Policy covers every path; `/app/` (the app's page) replaces it with the app's
  own policy, which allows Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`).
  `/app/assets/*` is cached as immutable; `/app/` and `/app/sw.js` revalidate on every load.

## Deploying

```sh
pnpm --filter @overlap/landing exec wrangler login   # once; or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
SITE_URL=https://your.domain vp run deploy:landing   # build:site && wrangler deploy
vp run --filter @overlap/landing preview             # local: build:site && wrangler dev
```

`SITE_URL` sets Astro's `site`; without it the pages have no canonical or `og:url` tags. Add
`PUBLIC_APP_URL=https://app.example.com/` to deploy the landing page alone. The Worker is served
on `workers.dev` until a route or custom domain is added to `wrangler.jsonc`.

## Tests

`vp test` runs the unit tests of the packages listed in `test.projects` of the root
`vite.config.ts` (`vp test watch` to watch). Each package keeps its test settings in its own
`vite.config.ts`. The landing page has one only for that (Astro does not read it); it resolves
the `@/` alias from `tsconfig.json`. Tests import from `vite-plus/test` and sit next to the module
they test as `*.test.ts`, never under `src/pages/` (Astro would route them). They are not
imported by any page, so they are not part of the build.

`apps/landing/src/data/events.test.ts` covers the search and the demo data of
`apps/landing/src/data/events.ts`.

## The landing page

`apps/landing/src/pages/index.astro` is one page: the hero, three static sections and the footer.

- `src/components/landing/` is the hero, the page's main React island (`client:load`).
  `Hero.tsx` lays it out: the event cards travel through the Depth Field in the background, the
  Liquid Glass Orb and the single prompt-kit ask box sit in the middle, and the Bubble UI glass
  controls (menu, pause, "Online only", "Minimum fit") filter what is in the field.
  `use-ask-flow.ts` is the small state machine behind it (ask -> thinking -> searching -> answer),
  `use-error-flash.ts` the red flash and slight zoom when an ask fits nothing (at most once a
  second), `SkullWall.tsx` the wall of 💀 in that red for one ask only, "He is dead." (the Steve
  Jobs example, `SKULL_ASK` in `src/data/events.ts`), put on the page only once that ask is made
  (devices without an emoji font then get the skull from a one-glyph Noto Color Emoji subset,
  `src/assets/fonts/`, wired in `astro.config.ts`),
  `settings.ts` holds the approved settings of each ReactDrops component (do not tidy those
  numbers), `GetStarted.tsx` is the Chromatic Button call to action, `hero.css` the layout.
- `src/components/sections/` holds the sections below the hero. They are static `.astro` files
  with no client JavaScript, except `FinalCta.tsx` (`client:visible`), whose glass button
  refracts the card collage behind it.
- Colours are the app's palette (`@theme` in `src/styles/global.css`). Corners use the
  `squircle-*` utilities defined there: a plain radius everywhere and, where the browser supports
  `corner-shape: squircle`, a larger radius drawn as a squircle.

`src/pages/get-started.astro` (`/get-started`) is where every "Get started" goes: a login page in
looks only, static and without client JavaScript (its parts and CSS are in
`src/components/get-started/`). Its photo, `src/assets/get-started-crowd.webp` (3:2, at least
1536 x 1024; made with an image model for this page, not a stock photo), is turned into AVIF and
WebP at build time; `--gs-photo-focus` in `get-started.css` is the point of the picture that stays
in view at every size (the person standing still) and `--gs-photo-clear` how much of its width is
free for the tagline to the left of them. Nothing typed into the page is sent: its fields have no
`name`. "Log in" (a GET form) and "Sign up here" open the platform (`PLATFORM_URL`) with
`?from=get-started`. The organiser view has no login and takes no notice of the query. The app
(`apps/app/src/lib/handoff.ts`) reads it once, removes it from the address and signs the visitor
in as the demo unless an email is stored, so they skip the app's own login. The query is defined in
both apps; `src/config.test.ts` fails when the two differ.

## Event data and card images

The landing page's demo events, their search (`queryTerms`, `matchEvents`) and the example profiles
(`ASK_SUGGESTIONS`) are in `apps/landing/src/data/events.ts`. Each event's card image is rendered
at build time by the static endpoint `apps/landing/src/pages/events/[id].webp.ts` and served as
`/events/<id>.webp` (cached for a day, see `_headers`). The card template and the pipeline
(satori -> resvg -> sharp) are in `apps/landing/src/cards/`; the files are `EVENT_IMAGE_DENSITY`
times the layout size in `EVENT_SHAPES`, because the depth field draws the nearest cards large.
`src/pages/og.png.ts` renders the social image the same way.

## Vite+ and Astro

`pnpm-workspace.yaml` overrides every `vite` dependency with `@voidzero-dev/vite-plus-core`
(managed by `vp migrate`), so the app, Astro and all Vite plugins share one Vite instance.
`astro dev` and `astro build` run on it unchanged. One addition was needed: `apps/landing`
declares `"vite": "catalog:"` itself. Without it, pnpm auto-installs upstream `vite` for the
`vite` peers of `@astrojs/react` and `@tailwindcss/vite` (overrides do not apply to auto-installed
peers), and those plugins would run on a second Vite copy next to Astro's.

## Third-party components

`apps/landing/src/components/{chromatic-*,depth-*,liquid-glass-orb*}` and
`apps/landing/src/components/soap-bubble/` are [ReactDrops](https://reactdrops.dev) components,
kept byte-identical to their registry source and excluded from `vp fmt` and `vp lint` (root
`vite.config.ts`). Do not edit them. Their licence (ReactDrops Component License 1.0, header of
each file) allows using them inside this end product, but not redistributing them as a component
kit. The shadcn CLI strips that header, so after `shadcn add` restore the files from the
registry JSON (`files[].content`).

`apps/landing/src/lib/island/` (the engine) and `apps/landing/src/components/islandcn/` (the
incoming call preset and the kit pieces it imports) are
[islandcn](https://github.com/opencoredev/islandcn), a Dynamic Island for React, copied verbatim
from commit `0011a41` and excluded from `vp fmt` and `vp lint` in the same way. Do not edit them.
It is MIT licensed; the notice is in `src/lib/island/LICENSE`. The page's incoming call
(`src/components/landing/IncomingCall.tsx`) is built on it.

`src/components/ui/` holds prompt-kit's Prompt Input and the shadcn/ui primitives it uses
(`components.json`); these are ordinary project code.
