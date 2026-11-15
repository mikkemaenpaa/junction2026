// Turns whatever an applicant types into links the collection can read: adds what is missing,
// repairs common slips ("linkedin.com/name" for "linkedin.com/in/name") and says why something
// cannot be used. Pure functions with no I/O, so the same rules can run in a browser.

export const MAX_LINKS = 8

export interface ParsedLink {
  /** What the applicant typed. */
  input: string
  /** The address that is read. */
  url: string
  /** True when the address was repaired, not just completed with "https://". */
  fixed: boolean
}

export interface RejectedLink {
  input: string
  /** Why it cannot be read, as a sentence for the applicant. */
  reason: string
}

export interface ParsedLinks {
  links: ParsedLink[]
  rejected: RejectedLink[]
}

// Query parameters that only track where a visitor came from.
const TRACKING =
  /^(utm_.+|trk|trkinfo|lipi|original_?subdomain|originalsubdomain|ref|ref_src|ref_url|referrer|source|igshid|igsh|si|fbclid|gclid|mc_cid|mc_eid|feature|share|s|t|lang|hl|locale|mibextid)$/i

// "name: handle" as people write it in a sentence. Each builds the profile address.
const HANDLE_SITES: Record<string, (handle: string) => string> = {
  github: (h) => `https://github.com/${h}`,
  gitlab: (h) => `https://gitlab.com/${h}`,
  linkedin: (h) => `https://www.linkedin.com/in/${h}`,
  kaggle: (h) => `https://www.kaggle.com/${h}`,
  huggingface: (h) => `https://huggingface.co/${h}`,
  twitter: (h) => `https://x.com/${h}`,
  instagram: (h) => `https://www.instagram.com/${h}`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
  medium: (h) => `https://medium.com/@${h}`,
  behance: (h) => `https://www.behance.net/${h}`,
  dribbble: (h) => `https://dribbble.com/${h}`,
  snapchat: (h) => `https://www.snapchat.com/add/${h}`,
  orcid: (h) => `https://orcid.org/${h}`,
}
const HANDLE_FORM = new RegExp(
  `\\b(${Object.keys(HANDLE_SITES).join('|')})\\s*[:=]\\s*@?([A-Za-z0-9][\\w.-]{0,60})(?=$|[\\s,;])`,
  'gi',
)

const ORCID_ID = /^\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$/
const FILE_ENDINGS = /\.(pdf|docx?|pptx?|xlsx?|png|jpe?g|gif|svg|txt|md|zip|csv|json|html?)$/i

// First path segments that are pages of the site itself, not somebody's account.
const SITE_PAGES: Record<string, Set<string>> = {
  linkedin: new Set(
    `feed jobs login signup home mynetwork messaging notifications search learning help legal checkpoint authwall
    uas groups events sales talent premium me psettings redir start`.split(/\s+/),
  ),
  github: new Set(
    `topics login logout join signup features solutions orgs sponsors collections about site pricing security
    resources enterprise team customer-stories readme trending marketplace explore settings notifications new
    search pulls issues codespaces apps contact events`.split(/\s+/),
  ),
  x: new Set('home explore i search settings intent share hashtag notifications messages login signup'.split(' ')),
  instagram: new Set('explore accounts stories direct reels about developer legal'.split(' ')),
  tiktok: new Set('foryou following explore live upload login signup discover tag music'.split(' ')),
  snapchat: new Set('add discover spotlight lens-studio download'.split(' ')),
  kaggle: new Set(
    `rankings competitions datasets models code discussions learn account benchmarks organizations docs terms
    privacy cookies contact host team about progression search discussion`.split(/\s+/),
  ),
}

const reject = (reason: string) => ({ reason })
type Canonical = string | { reason: string }

/** The canonical address on sites whose profile addresses people often get wrong. */
function canonical(host: string, segments: string[], url: URL): Canonical | null {
  const [first = '', second = ''] = segments
  const lower = first.toLowerCase()

  if (host === 'lnkd.in') return reject('A LinkedIn short link. Paste the full address of the profile instead.')
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    // Country and mobile sites (fi.linkedin.com, m.linkedin.com) show the same profile.
    const base = 'https://www.linkedin.com'
    const rest = lower === 'mwlite' ? segments.slice(1) : segments
    const [kind = '', slug = ''] = rest
    const page = kind.toLowerCase()
    if (page === 'in') {
      return slug
        ? `${base}/in/${slug.toLowerCase()}`
        : reject('The LinkedIn address has no name in it: use linkedin.com/in/your-name.')
    }
    if (['pub', 'posts', 'pulse', 'company', 'school', 'showcase'].includes(page) && slug)
      return `${base}/${rest.join('/')}`
    if (page === 'feed' && rest[1] === 'update' && rest[2]) return `${base}/feed/update/${rest[2]}`
    if (!page || SITE_PAGES.linkedin!.has(page))
      return reject('A page of LinkedIn itself, not a profile: use linkedin.com/in/your-name.')
    // "linkedin.com/name": the "/in/" is missing.
    return rest.length === 1
      ? `${base}/in/${page}`
      : reject('Not a LinkedIn profile address: use linkedin.com/in/your-name.')
  }

  if (host === 'github.com') {
    if (!first || SITE_PAGES.github!.has(lower)) return reject('A page of GitHub itself, not an account.')
    // Keep an explicitly chosen repository (including links to its files). The collector
    // groups these by account, but must still open each chosen repository.
    const repo = second.replace(/\.git$/i, '').toLowerCase()
    return `https://github.com/${lower}${repo ? `/${repo}` : ''}`
  }

  if (host === 'twitter.com' || host === 'x.com') {
    if (!first || SITE_PAGES.x!.has(lower)) return reject('A page of X itself, not an account.')
    return `https://x.com/${first.replace(/^@/, '')}`
  }

  if (host === 'instagram.com') {
    if (!first || SITE_PAGES.instagram!.has(lower)) return reject('A page of Instagram itself, not an account.')
    if (['p', 'reel', 'tv'].includes(lower)) return second ? `https://www.instagram.com/${lower}/${second}/` : null
    return `https://www.instagram.com/${first.replace(/^@/, '')}/`
  }

  if (host === 'tiktok.com') {
    if (!first || SITE_PAGES.tiktok!.has(lower)) return reject('A page of TikTok itself, not an account.')
    const handle = `@${first.replace(/^@/, '')}`
    return second === 'video' && segments[2]
      ? `https://www.tiktok.com/${handle}/video/${segments[2]}`
      : `https://www.tiktok.com/${handle}`
  }

  if (host === 'snapchat.com') {
    if (lower === 'add' && second) return `https://www.snapchat.com/add/${second}`
    if (!first || SITE_PAGES.snapchat!.has(lower)) return reject('A page of Snapchat itself, not an account.')
    return `https://www.snapchat.com/add/${first.replace(/^@/, '')}`
  }

  if (host === 'youtu.be')
    return first ? `https://www.youtube.com/watch?v=${first}` : reject('A YouTube link with no video in it.')
  if (host === 'youtube.com') {
    const video = url.searchParams.get('v')
    if (lower === 'watch')
      return video ? `https://www.youtube.com/watch?v=${video}` : reject('A YouTube link with no video in it.')
    if (first.startsWith('@')) return `https://www.youtube.com/${first}`
    if (['c', 'channel', 'user'].includes(lower) && second) return `https://www.youtube.com/${lower}/${second}`
    return first ? null : reject("YouTube's front page, not a channel.")
  }

  if (host === 'kaggle.com') {
    if (!first || SITE_PAGES.kaggle!.has(lower)) return reject('A page of Kaggle itself, not an account.')
    // The profile's front page says little; the notebooks tab lists the work.
    return segments.length === 1 ? `https://www.kaggle.com/${first}/code` : null
  }

  if (host.startsWith('scholar.google.')) {
    const user = url.searchParams.get('user')
    return user
      ? `https://scholar.google.com/citations?user=${user}`
      : reject('A Google Scholar search, not a profile: open your profile and copy its address.')
  }

  if (host === 'orcid.org') {
    return ORCID_ID.test(first)
      ? `https://orcid.org/${first.toUpperCase()}`
      : reject('The ORCID address has no iD in it.')
  }

  return null
}

function parseOne(input: string): Canonical | null {
  const text = input.replace(/^[\s<([{'"`]+/, '').replace(/[\s>)\]}'"`.,;:!?]+$/, '')
  if (!text) return null

  if (ORCID_ID.test(text)) return `https://orcid.org/${text.toUpperCase()}`
  // A scheme other than http(s). "example.com:8080" is a host with a port, not a scheme.
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(text) && !/^https?:\/\//i.test(text)) {
    return /^mailto:/i.test(text)
      ? reject('An email address, not a link to your work.')
      : reject('Only web addresses (http or https) can be read.')
  }
  const bare = text.replace(/^https?:\/\//i, '')
  if (/^[^/\s@]+@[^/\s@]+\.[a-z]{2,}$/i.test(bare)) return reject('An email address, not a link to your work.')
  if (/^@[\w.-]+$/.test(bare)) return reject(`Which site is ${bare} on? Write it like github.com/${bare.slice(1)}.`)

  // Anything without a dotted host is ordinary text ("my", "portfolio"), not a failed link.
  const hostPart = bare.split(/[/?#]/)[0]!.toLowerCase()
  if (
    !/^[\p{L}\p{N}]([\p{L}\p{N}-]*[\p{L}\p{N}])?(\.[\p{L}\p{N}]([\p{L}\p{N}-]*[\p{L}\p{N}])?)+(:\d+)?$/u.test(hostPart)
  )
    return null
  const hostName = hostPart.replace(/:\d+$/, '')
  if (!/\.\p{L}{2,24}$/u.test(hostName)) {
    return /^\d+(\.\d+){3}$/.test(hostName)
      ? reject('A numeric address cannot be read: give the page’s web address.')
      : null
  }
  // "cv.pdf" on its own is a file name, not a site.
  if (!bare.includes('/') && FILE_ENDINGS.test(hostName)) return null
  if (/(^|\.)(localhost|local|internal|lan|test|invalid|example)$/.test(hostName))
    return reject('An address on a private network cannot be read.')

  let url: URL
  try {
    url = new URL(`https://${bare}`)
  } catch {
    return reject('Not a web address that can be opened.')
  }
  const host = url.hostname.replace(/^(www|m|mobile)\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  const known = canonical(host, segments, url)
  if (known) return known

  // A copy of the keys: deleting while walking the live list would skip some.
  for (const key of Array.from(url.searchParams.keys())) if (TRACKING.test(key)) url.searchParams.delete(key)
  url.hash = ''
  url.port = ''
  const path = url.pathname.replace(/\/+$/, '')
  return `https://${url.hostname}${path}${url.search}`
}

const comparable = (url: string) =>
  url
    .replace(/^https?:\/\/(www\.)?/i, '')
    .replace(/\/+$/, '')
    .toLowerCase()

/** Every usable link in a piece of text, repaired and without repeats, and what was left out. */
export function parseLinks(text: string): ParsedLinks {
  const links: ParsedLink[] = []
  const rejected: RejectedLink[] = []
  const seen = new Set<string>()

  const spelled = text
    // A Markdown link: keep the address.
    .replace(/\[[^\]]*\]\(([^)\s]+)\)/g, ' $1 ')
    // "github: name" becomes the address before the text is cut into pieces. A value that is
    // itself a site ("github: github.com/name") is left for the next step.
    .replace(HANDLE_FORM, (whole, site: string, handle: string) =>
      /\.[a-z]{2,}$/i.test(handle) ? whole : ` ${HANDLE_SITES[site.toLowerCase()]!(handle)} `,
    )

  for (const input of spelled.split(/[\s,;]+/).filter(Boolean)) {
    const result = parseOne(input)
    if (!result) continue
    if (typeof result !== 'string') {
      rejected.push({ input, reason: result.reason })
      continue
    }
    const key = comparable(result)
    if (seen.has(key)) continue
    seen.add(key)
    if (links.length >= MAX_LINKS) {
      rejected.push({ input, reason: `Only the first ${MAX_LINKS} links are read.` })
      continue
    }
    links.push({ input, url: result, fixed: comparable(input.replace(/^[<([{'"`]+|[>)\]}'"`.,;:!?]+$/g, '')) !== key })
  }
  return { links, rejected }
}
