// Client for the pre-selection backend (apps/preselect): sends a public profile typed in the
// ask box, which the backend reads and scores for the organiser, and says which companies at
// the event the profile overlaps with. No score or field ever comes back to the page.

import { PRESELECT_URL } from '@/config'

/** False when no backend is configured. */
export const profilesEnabled = PRESELECT_URL !== ''

const SITES =
  'linkedin\\.com|lnkd\\.in|github\\.com|github\\.io|gitlab\\.com|x\\.com|twitter\\.com|instagram\\.com|tiktok\\.com|youtube\\.com|youtu\\.be|snapchat\\.com|kaggle\\.com|orcid\\.org|scholar\\.google|medium\\.com|behance\\.net|huggingface\\.co|researchgate\\.net'
const ENDINGS = 'com|org|net|io|dev|fi|me|app|co|ai|tech|xyz|page|site|se|de|uk|eu|info|edu'
const PROFILE = new RegExp(
  [
    'https?://',
    '\\bwww\\.',
    `\\b(${SITES})\\b`,
    // An address with a path, or a bare site with a common ending ("adaexample.dev").
    '\\b[\\w-]+(\\.[\\w-]+)+/\\S',
    `\\b[\\w-]+\\.(${ENDINGS})\\b`,
    // "github: name"
    '\\b(github|gitlab|linkedin|kaggle|twitter|instagram|tiktok|youtube|medium|orcid)\\s*[:=]\\s*@?\\w',
    // An ORCID iD
    '\\b\\d{4}-\\d{4}-\\d{4}-\\d{3}[\\dXx]\\b',
  ].join('|'),
  'i',
)

/** Whether the text holds a profile (an address, "site: name" or an ORCID iD) rather than an ask. */
export const looksLikeProfile = (text: string) => PROFILE.test(text)

// As many companies are named; the rest are counted.
const NAMED = 3

/**
 * The match as one line for the ask box, or null when there is none.
 * "You match 7 companies at Deep Tech Talent Forum: A, B, C and 4 more."
 */
export function overlapLine(event: string, companies: readonly string[]): string | null {
  if (!companies.length) return null
  const named = companies.slice(0, NAMED)
  const more = companies.length - named.length
  const names =
    more > 0
      ? `${named.join(', ')} and ${more} more`
      : named.length > 1
        ? `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}`
        : named[0]
  const count = `${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`
  return `You match ${count} at ${event}: ${names}.`
}

/**
 * Send the profile to the backend, which repairs the links itself ("linkedin.com/name" becomes
 * "linkedin.com/in/name"), and wait for it to be read (often 10 to 20 seconds). Answers with the
 * companies the profile matches, best first (empty when none), or null when the backend cannot
 * be reached or could not read the profile. Every failure is logged to the console with its cause.
 */
export async function readProfile(text: string, signal?: AbortSignal): Promise<string[] | null> {
  const url = `${PRESELECT_URL}/api/apply`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    })
  } catch (error) {
    if (!signal?.aborted)
      console.error(
        `[preselect] ${url} could not be reached: is the backend running, and is ${location.origin} in its PRESELECT_ALLOWED_ORIGINS?`,
        error,
      )
    return null
  }
  let answer: { event?: unknown; companies?: unknown; sources?: unknown; error?: unknown }
  try {
    answer = await response.json()
  } catch (error) {
    console.error(`[preselect] ${url} answered ${response.status} without JSON.`, error)
    return null
  }
  if (!response.ok || typeof answer.event !== 'string') {
    console.error(`[preselect] ${url} answered ${response.status}:`, answer.error ?? answer)
    return null
  }
  // A link the backend could not read still gets an answer, with fewer companies or none.
  for (const source of Array.isArray(answer.sources) ? answer.sources : []) {
    if (source?.ok === false) console.warn(`[preselect] could not read ${source.url ?? source.label}:`, source.error)
  }
  return Array.isArray(answer.companies) ? answer.companies.filter((c) => typeof c === 'string') : []
}
