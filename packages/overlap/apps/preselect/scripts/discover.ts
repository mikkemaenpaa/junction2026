// Finds public portfolio pages to test the scoring with: reads listing pages (GitHub topics,
// Semantic Scholar searches, Kaggle rankings and so on) through Context.dev and keeps the
// profile links on them. The result goes to data/seeds.json, which is not committed.
//
//   node scripts/discover.ts
import { scrape } from '../src/lib/contextdev.ts'
import { githubTarget } from '../src/lib/github.ts'
import { writeData } from '../src/lib/store.ts'
import type { FieldId } from '../src/lib/types.ts'

type Kind =
  | 'github'
  | 'semanticscholar'
  | 'kaggle'
  | 'medium'
  | 'behance'
  | 'hackster'
  | 'oshwlab'
  | 'hackaday'
  | 'tinytapeout'

interface Listing {
  /** The field the profiles apply to. "off" marks portfolios from outside deep tech, used as a contrast. */
  field: FieldId | 'off'
  kind: Kind
  url: string
  take: number
}

const topic = (name: string, sort: 'stars' | 'updated' = 'updated') =>
  `https://github.com/topics/${name}?o=desc&s=${sort}`
const papers = (query: string) => `https://www.semanticscholar.org/search?q=${encodeURIComponent(query)}&sort=relevance`
const mediumTag = (tag: string) => `https://medium.com/tag/${tag}/recommended`

const LISTINGS: Listing[] = [
  { field: 'semiconductors', kind: 'github', url: topic('verilog'), take: 6 },
  { field: 'semiconductors', kind: 'github', url: topic('asic', 'stars'), take: 4 },
  { field: 'semiconductors', kind: 'github', url: topic('risc-v'), take: 4 },
  { field: 'semiconductors', kind: 'tinytapeout', url: 'https://tinytapeout.com/runs/tt08/', take: 3 },
  { field: 'semiconductors', kind: 'semanticscholar', url: papers('CMOS integrated circuit design'), take: 4 },
  {
    field: 'semiconductors',
    kind: 'semanticscholar',
    url: papers('atomic layer deposition semiconductor process'),
    take: 3,
  },

  { field: 'photonics', kind: 'github', url: topic('photonics', 'stars'), take: 5 },
  { field: 'photonics', kind: 'github', url: topic('optics'), take: 4 },
  { field: 'photonics', kind: 'github', url: topic('lidar'), take: 3 },
  { field: 'photonics', kind: 'semanticscholar', url: papers('silicon photonics integrated circuits'), take: 5 },
  { field: 'photonics', kind: 'semanticscholar', url: papers('semiconductor laser optoelectronics'), take: 3 },

  { field: 'quantum', kind: 'github', url: topic('quantum-computing'), take: 6 },
  { field: 'quantum', kind: 'github', url: topic('qiskit', 'stars'), take: 4 },
  { field: 'quantum', kind: 'semanticscholar', url: papers('quantum error correction'), take: 5 },
  { field: 'quantum', kind: 'semanticscholar', url: papers('superconducting qubits cryogenic'), take: 4 },

  { field: 'embedded', kind: 'github', url: topic('stm32'), take: 5 },
  { field: 'embedded', kind: 'github', url: topic('embedded-systems', 'stars'), take: 4 },
  { field: 'embedded', kind: 'github', url: topic('kicad'), take: 4 },
  { field: 'embedded', kind: 'hackster', url: 'https://www.hackster.io/projects?sort=trending', take: 4 },
  { field: 'embedded', kind: 'oshwlab', url: 'https://oshwlab.com/explore', take: 3 },
  { field: 'embedded', kind: 'hackaday', url: 'https://hackaday.io/projects?sort=skulls', take: 3 },

  { field: 'space', kind: 'github', url: topic('cubesat', 'stars'), take: 5 },
  { field: 'space', kind: 'github', url: topic('remote-sensing'), take: 4 },
  { field: 'space', kind: 'github', url: topic('gnss'), take: 3 },
  { field: 'space', kind: 'semanticscholar', url: papers('CubeSat satellite instrument'), take: 4 },
  { field: 'space', kind: 'semanticscholar', url: papers('spaceborne spectrometer calibration'), take: 3 },

  { field: 'ai', kind: 'github', url: topic('pytorch'), take: 6 },
  { field: 'ai', kind: 'github', url: topic('deep-learning', 'stars'), take: 4 },
  { field: 'ai', kind: 'github', url: topic('hpc'), take: 3 },
  { field: 'ai', kind: 'kaggle', url: 'https://www.kaggle.com/rankings', take: 4 },
  { field: 'ai', kind: 'semanticscholar', url: papers('deep learning scientific computing'), take: 3 },

  { field: 'research', kind: 'semanticscholar', url: papers('photonic integrated circuits fabrication'), take: 5 },
  { field: 'research', kind: 'semanticscholar', url: papers('quantum sensing nanotechnology'), take: 5 },
  { field: 'research', kind: 'semanticscholar', url: papers('microelectronics packaging reliability'), take: 5 },
  { field: 'research', kind: 'semanticscholar', url: papers('machine learning materials discovery'), take: 4 },

  { field: 'business', kind: 'medium', url: mediumTag('product-management'), take: 6 },
  { field: 'business', kind: 'medium', url: mediumTag('business-development'), take: 5 },
  { field: 'business', kind: 'medium', url: mediumTag('b2b-sales'), take: 5 },

  // Portfolios from outside deep tech. They apply like anyone else and should end up at the bottom.
  { field: 'off', kind: 'behance', url: 'https://www.behance.net/search/users?search=illustration', take: 5 },
  { field: 'off', kind: 'medium', url: mediumTag('cooking'), take: 4 },
  { field: 'off', kind: 'medium', url: mediumTag('travel'), take: 3 },
  { field: 'off', kind: 'github', url: topic('wordpress-theme'), take: 4 },
]

// First path segments that are site navigation, not accounts.
const NAVIGATION: Record<string, string[]> = {
  github: [
    'topics',
    'login',
    'features',
    'solutions',
    'orgs',
    'sponsors',
    'collections',
    'about',
    'site',
    'pricing',
    'security',
    'resources',
    'enterprise',
    'team',
    'customer-stories',
    'readme',
    'trending',
    'marketplace',
    'why-github',
    'signup',
    'contact',
    'premium-support',
    'open-source',
    'mcp',
    'partners',
    'events',
    'newsroom',
    'github',
  ],
  kaggle: [
    'rankings',
    'competitions',
    'datasets',
    'models',
    'code',
    'discussions',
    'learn',
    'account',
    'benchmarks',
    'arenas',
    'game-arena',
    'organizations',
    'docs',
    'terms',
    'privacy',
    'cookies',
    'contact',
    'host',
    'team',
    'about',
    'progression',
    'search',
    'discussion',
  ],
  behance: [
    'search',
    'hire',
    'galleries',
    'joblist',
    'assets',
    'live',
    'blog',
    'about',
    'misc',
    'careers',
    'pro',
    'onboarding',
    'for_you',
    'gallery',
    'features',
    'freelancers',
    'inbox',
    'dmca',
    'jobs',
  ],
  hackster: [
    'projects',
    'channels',
    'users',
    'contests',
    'news',
    'videos',
    'workshops',
    'about',
    'products',
    'platforms',
    'topics',
    'communities',
    'live',
    'events',
    'hardware',
    'apps',
    'search',
    'terms',
    'privacy',
    'conduct',
    'business',
    'hackster',
    'member',
    'certifications',
    'impact',
  ],
  oshwlab: [
    'activities',
    'explore',
    'courses',
    'article',
    'search',
    'news',
    'login',
    'register',
    'about',
    'user',
    'project',
    'docs',
  ],
}

function profilesOn(kind: Kind, markdown: string): string[] {
  const links = [...markdown.matchAll(/\]\((https?:\/\/[^)\s]+)/g)].map((m) => m[1]!)
  const out = new Set<string>()
  const first = (url: string) => new URL(url).pathname.split('/').filter(Boolean)
  for (const link of links) {
    try {
      const host = new URL(link).hostname.replace(/^www\./, '')
      const segments = first(link)
      const account = segments[0]?.toLowerCase() ?? ''
      if (
        kind === 'github' &&
        host === 'github.com' &&
        segments.length === 2 &&
        !NAVIGATION.github!.includes(account)
      ) {
        const target = githubTarget(link)
        if (target) out.add(`https://github.com/${target.login}`)
      } else if (
        kind === 'semanticscholar' &&
        host === 'semanticscholar.org' &&
        segments[0] === 'author' &&
        /^\d+$/.test(segments[2] ?? '')
      ) {
        out.add(`https://www.semanticscholar.org/author/${segments[1]}/${segments[2]}`)
      } else if (
        kind === 'kaggle' &&
        host === 'kaggle.com' &&
        segments.length === 1 &&
        !NAVIGATION.kaggle!.includes(account)
      ) {
        out.add(`https://www.kaggle.com/${segments[0]}/code`)
      } else if (kind === 'medium' && host === 'medium.com' && segments[0]?.startsWith('@')) {
        out.add(`https://medium.com/${segments[0]}`)
      } else if (
        kind === 'behance' &&
        host === 'behance.net' &&
        segments.length === 1 &&
        !NAVIGATION.behance!.includes(account)
      ) {
        out.add(`https://www.behance.net/${segments[0]}`)
      } else if (
        kind === 'hackster' &&
        host === 'hackster.io' &&
        segments.length === 2 &&
        !NAVIGATION.hackster!.includes(account)
      ) {
        out.add(`https://www.hackster.io/${segments[0]}`)
      } else if (
        kind === 'oshwlab' &&
        host === 'oshwlab.com' &&
        segments.length >= 1 &&
        !NAVIGATION.oshwlab!.includes(account)
      ) {
        out.add(`https://oshwlab.com/${segments[0]}`)
      } else if (kind === 'hackaday' && host === 'hackaday.io' && segments[0] === 'project' && segments[1]) {
        out.add(`https://hackaday.io/project/${segments[1]}`)
      } else if (
        kind === 'tinytapeout' &&
        host === 'tinytapeout.com' &&
        segments[0] === 'chips' &&
        segments.length === 3
      ) {
        out.add(`https://tinytapeout.com/chips/${segments[1]}/${segments[2]}`)
      }
    } catch {
      // Not a usable link.
    }
  }
  return [...out]
}

/** `count` items spread evenly over the list, so a listing's top and bottom are both sampled. */
function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items
  return Array.from({ length: count }, (_, i) => items[Math.floor((i * items.length) / count)]!)
}

export interface Seed {
  field: FieldId | 'off'
  link: string
  listing: string
}

const seeds: Seed[] = []
const seen = new Set<string>()
let credits = 0

await Promise.all(
  LISTINGS.map(async (listing) => {
    const page = await scrape(listing.url, { markdown: true })
    credits += page.credits
    const found = page.ok && page.markdown ? profilesOn(listing.kind, page.markdown) : []
    const fresh = found.filter((link) => !seen.has(link))
    const taken = spread(fresh, listing.take)
    for (const link of taken) {
      seen.add(link)
      seeds.push({ field: listing.field, link, listing: listing.url })
    }
    console.log(
      `${String(taken.length).padStart(2)}/${String(found.length).padStart(3)} ${listing.field.padEnd(15)} ${listing.kind.padEnd(16)} ${page.ok ? '' : `FAILED ${page.error} `}${listing.url}`,
    )
  }),
)

writeData('seeds.json', seeds)
const perField: Record<string, number> = {}
for (const seed of seeds) perField[seed.field] = (perField[seed.field] ?? 0) + 1
console.log(`\n${seeds.length} seeds written to data/seeds.json, ${credits} credits used`)
console.log(perField)
