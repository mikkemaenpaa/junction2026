// Client for LinkedIn's Member Data Portability API (https://learn.microsoft.com/en-us/linkedin/dma/).
// The member signs in at LinkedIn and consents; the app then reads that member's own data.
// Server-side only: the client secret and access tokens must never reach the browser.
import { setting } from './settings.ts'

const AUTHORIZE_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const SNAPSHOT_URL = 'https://api.linkedin.com/rest/memberSnapshotData'
// The only version the snapshot endpoint accepts.
const API_VERSION = '202312'

/** Cookie that ties LinkedIn's answer to the browser that started the sign-in. */
export const STATE_COOKIE = 'linkedin_state'

// Career and activity data only. The API also offers messages, logins, searches, contacts,
// phone numbers and ad data; none of that is read.
export const SNAPSHOT_DOMAINS = [
  'PROFILE',
  'PROFILE_SUMMARY',
  'POSITIONS',
  'EDUCATION',
  'SKILLS',
  'CERTIFICATIONS',
  'COURSES',
  'LANGUAGES',
  'HONORS',
  'PROJECTS',
  'PUBLICATIONS',
  'PATENTS',
  'ORGANIZATIONS',
  'VOLUNTEERING_EXPERIENCES',
  'TEST_SCORES',
  'RECOMMENDATIONS',
  'ENDORSEMENTS',
  'CONNECTIONS',
  'MEMBER_SHARE_INFO',
  'ARTICLES',
  'ALL_COMMENTS',
  'ALL_LIKES',
  'INSTANT_REPOSTS',
] as const
export type SnapshotDomain = (typeof SNAPSHOT_DOMAINS)[number]

// An app reading its owner's data uses the self-serve scope; an app LinkedIn has reviewed for
// other members' data sets LINKEDIN_SCOPE to r_dma_portability_3rd_party.
const scope = () => setting('LINKEDIN_SCOPE', 'r_dma_portability_self_serve')

/** Where the member is sent to sign in and consent. */
export function authorizationUrl(state: string, redirectUri: string): string {
  const query = new URLSearchParams({
    response_type: 'code',
    client_id: setting('LINKEDIN_CLIENT_ID'),
    redirect_uri: redirectUri,
    scope: scope(),
    state,
  })
  return `${AUTHORIZE_URL}?${query}`
}

/** Trade the code LinkedIn sent back for an access token. */
export async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: setting('LINKEDIN_CLIENT_ID'),
      client_secret: setting('LINKEDIN_CLIENT_SECRET'),
    }),
    signal: AbortSignal.timeout(30_000),
  })
  const json: any = await response.json().catch(() => null)
  if (!response.ok || !json?.access_token) {
    throw new Error(
      `LinkedIn token: HTTP ${response.status} ${[json?.error, json?.error_description].filter(Boolean).join(': ')}`,
    )
  }
  return json.access_token
}

const MAX_PAGES = 200

/** All rows of one domain of the member's data. A domain the member has nothing in is empty. */
export async function fetchSnapshot(token: string, domain: SnapshotDomain): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = []
  let url: string | null = `${SNAPSHOT_URL}?q=criteria&domain=${domain}`
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const response: Response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Linkedin-Version': API_VERSION,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(60_000),
    })
    const json: any = await response.json().catch(() => null)
    if (!response.ok) {
      // The API reports the end of a domain, or a domain with no data, as an error.
      if (response.status === 404 || page > 0) break
      throw new Error(
        `LinkedIn ${domain}: HTTP ${response.status} ${[json?.code, json?.message].filter(Boolean).join(': ')}`,
      )
    }
    for (const element of json?.elements ?? []) rows.push(...(element?.snapshotData ?? []))
    const next = (json?.paging?.links ?? []).find((link: any) => link?.rel === 'next')?.href
    url = next ? new URL(next, SNAPSHOT_URL).href : null
  }
  return rows
}
