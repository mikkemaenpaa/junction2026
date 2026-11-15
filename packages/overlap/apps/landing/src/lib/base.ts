// The site's base path. The composed site is served below one (/submission on junction2026.com, see
// the root `build:site` script), so every root-relative URL the landing page emits goes through
// `sitePath`. Astro and Vite prefix their own output (_astro/, fonts, images) themselves.

/**
 * `path`, a root-relative URL written for a site at the root ("/", "/get-started", "/#how",
 * "/app/"), below `base` ("/" or "/submission", with or without its slashes). The home page is the
 * base without a trailing slash: "/" becomes "/submission", "/#how" becomes "/submission#how".
 */
export function withBase(base: string, path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error(`Not a root-relative path: ${path}`)
  const trimmed = base.replace(/^\/+|\/+$/g, '')
  if (!trimmed) return path
  const prefix = `/${trimmed}`
  return /^\/(?=[?#]|$)/.test(path) ? `${prefix}${path.slice(1)}` : `${prefix}${path}`
}

/**
 * `path` below this build's base (`import.meta.env.BASE_URL`: "/" or "/submission", Astro's `base`
 * from SITE_BASE in astro.config.ts). The same on the server and in the islands.
 */
export const sitePath = (path: string): string => withBase(import.meta.env.BASE_URL, path)
