// The handoff from the landing page: its /get-started page (a login screen with no credentials)
// opens the app with ?from=get-started. A visitor who comes that way has already been through a
// login screen, so the store signs them in as the demo, as "Try the demo" does, instead of showing
// the app's own login (`load` in store.tsx). A stored email is kept.
//
// The same two constants are in apps/landing/src/config.ts; a test there (config.test.ts) fails
// when they differ. Change them together.
export const HANDOFF_PARAM = 'from'
export const HANDOFF_VALUE = 'get-started'

/**
 * Whether a query string (`location.search`, with or without its "?") carries the handoff, and the
 * query string to keep: the same without it ("" when nothing else is left).
 */
export function readHandoff(search: string): { handoff: boolean; search: string } {
  const params = [...new URLSearchParams(search)]
  const rest = params.filter(([name, value]) => !(name === HANDOFF_PARAM && value === HANDOFF_VALUE))
  if (rest.length === params.length) return { handoff: false, search }
  const query = new URLSearchParams(rest).toString()
  return { handoff: true, search: query ? `?${query}` : '' }
}

/** Reads the handoff from the address and removes it there (path, other parameters and hash kept). */
function takeHandoff(): boolean {
  if (typeof window === 'undefined') return false
  const { pathname, search, hash } = window.location
  const result = readHandoff(search)
  if (result.handoff) window.history.replaceState(window.history.state, '', `${pathname}${result.search}${hash}`)
  return result.handoff
}

/**
 * True when this page load came from /get-started. Read once, when this module loads, and removed
 * from the address right away, so a reload or a copied link does not carry it. Not in a state
 * initialiser or an effect: React's StrictMode runs those twice in development.
 */
export const CAME_FROM_GET_STARTED = takeHandoff()
