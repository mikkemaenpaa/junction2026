// Builds the site that apps/landing/wrangler.jsonc deploys: the landing page at / and the app at
// /app/, both in apps/landing/dist. Run it with `vp run build:site` or `pnpm run build:site`.
//
//   1. apps/app      `build` script with APP_BASE=/app/ (skipped when PUBLIC_APP_URL is set)
//   2. apps/landing  `build` script (astro build, which empties apps/landing/dist first)
//   3. apps/app/dist is copied to apps/landing/dist/app
//
// With PUBLIC_APP_URL set, the landing page opens the app at that URL (APP_URL in
// apps/landing/src/config.ts), so the app is neither built nor bundled.
//
// "Get started" goes to /get-started, on the landing page's own origin. The "Log in" form there
// submits a GET form to the platform (PLATFORM_URL in config.ts): the pre-selection app when
// PUBLIC_PRESELECT_URL is set, else the app. When that is on another origin, the origin is added
// to `form-action` in dist/_headers.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** URL path of the app on the landing page's origin. Keep in sync with APP_URL in src/config.ts. */
const APP_BASE = '/app/'

const root = fileURLToPath(new URL('..', import.meta.url))
const appDist = path.join(root, 'apps/app/dist')
const landingDist = path.join(root, 'apps/landing/dist')
const target = path.join(landingDist, APP_BASE)

// The project-local Vite+ CLI is a Node script: run it with this Node binary (no shell, so it
// behaves the same on every platform, under `vp run` and under plain `pnpm run`).
const require = createRequire(import.meta.url)
const vpManifest = require.resolve('vite-plus/package.json')
const vp = path.join(path.dirname(vpManifest), JSON.parse(readFileSync(vpManifest, 'utf8')).bin.vp)

/** Runs `vp <args>` from the repository root and exits if it fails. */
function runVp(args, env = process.env) {
  console.log(`\n$ vp ${args.join(' ')}`)
  const { status, error } = spawnSync(process.execPath, [vp, ...args], { cwd: root, env, stdio: 'inherit' })
  if (error) throw error
  if (status !== 0) process.exit(status ?? 1)
}

function fail(message) {
  console.error(`\nbuild:site: ${message}`)
  process.exit(1)
}

const externalApp = process.env.PUBLIC_APP_URL

if (externalApp) {
  console.log(`build:site: PUBLIC_APP_URL=${externalApp}, so the app is not built or bundled.`)
} else {
  // FIGMA_PUBLIC_URL takes precedence over APP_BASE in apps/app/vite.config.ts; drop it so a shell
  // that has it set (Figma Make) cannot build the app for the wrong path.
  const env = { ...process.env, APP_BASE }
  delete env.FIGMA_PUBLIC_URL
  runVp(['run', '--filter', '@overlap/app', 'build'], env)
  if (!existsSync(path.join(appDist, 'index.html'))) fail(`${appDist}/index.html is missing after the app build.`)
}

runVp(['run', '--filter', '@overlap/landing', 'build'])

// The landing page's CSP has `form-action 'self'`, which blocks the "Log in" form of /get-started
// when the platform it opens is on another origin. Allow exactly that origin (a relative URL is
// same-origin already). The platform, as in config.ts: the pre-selection app, else the app.
const platform = process.env.PUBLIC_PRESELECT_URL || externalApp
const origin = platform && URL.canParse(platform) ? new URL(platform).origin : null
if (origin && origin !== 'null') {
  const file = path.join(landingDist, '_headers')
  const headers = readFileSync(file, 'utf8')
  const updated = headers.replaceAll("form-action 'self'", `form-action 'self' ${origin}`)
  if (updated === headers) fail(`no "form-action 'self'" in ${file} to add ${origin} to.`)
  writeFileSync(file, updated)
  console.log(`\nbuild:site: added ${origin} to form-action in apps/landing/dist/_headers`)
}

if (!externalApp) {
  // A landing page at the same path (src/pages/app.astro or src/pages/app/) would collide with the app.
  const segment = APP_BASE.replaceAll('/', '')
  if (existsSync(target) || existsSync(path.join(landingDist, `${segment}.html`))) {
    fail(`the landing build already has a page at ${APP_BASE}; it would collide with the app.`)
  }
  cpSync(appDist, target, { recursive: true })
  console.log(`\nbuild:site: copied apps/app/dist to apps/landing/dist${APP_BASE}`)
}
