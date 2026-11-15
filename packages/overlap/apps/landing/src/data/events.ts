// Demo events for the landing page. The first six are the same events as the app's mock data
// (apps/app/src/lib/data.ts); the rest extend the set so the depth field has enough variety.
// `fit` is a demo fit rating (0-100) for an example profile: the landing page has no account.
import { sitePath } from '@/lib/base'

export type EventTone = 'forest' | 'card' | 'lime' | 'coral' | 'ink'
export type EventShape = 'portrait' | 'landscape' | 'square'

export type LandingEvent = {
  id: string
  title: string
  category: string
  /** Short date as shown on the card, e.g. "Sat 14 Jun". */
  date: string
  time: string
  city: string
  venue: string
  online: boolean
  going: number
  fit: number
  fields: readonly string[]
  skills: readonly string[]
  companies: readonly string[]
  tone: EventTone
  shape: EventShape
}

/** Layout size of the card for each shape (long side 640). The image file is this times EVENT_IMAGE_DENSITY. */
export const EVENT_SHAPES: Record<EventShape, { width: number; height: number }> = {
  portrait: { width: 480, height: 640 },
  landscape: { width: 640, height: 448 },
  square: { width: 560, height: 560 },
}

/**
 * Output pixels per layout pixel of the generated card images. The depth field draws the nearest
 * cards several hundred CSS pixels wide, so the files carry more than their layout size.
 */
export const EVENT_IMAGE_DENSITY = 1.25

export const EVENTS: readonly LandingEvent[] = [
  {
    id: 'spring-tech-design-fair',
    title: 'Spring Tech & Design Fair',
    category: 'Career fair',
    date: 'Sat 14 Jun',
    time: '10:00 – 17:00',
    city: 'Berlin',
    venue: 'Station Hall',
    online: false,
    going: 482,
    fit: 88,
    fields: ['Design', 'Engineering', 'Data'],
    skills: ['Figma', 'React', 'TypeScript', 'Python'],
    companies: ['Northwind Labs', 'Paperplane', 'Atelier Vert', 'Tessera', 'Quanta Robotics'],
    tone: 'forest',
    shape: 'portrait',
  },
  {
    id: 'data-for-good-meetup',
    title: 'Data for Good Meetup',
    category: 'Networking',
    date: 'Wed 18 Jun',
    time: '18:30 – 21:00',
    city: 'Online',
    venue: 'Live rooms',
    online: true,
    going: 214,
    fit: 74,
    fields: ['Data', 'Product'],
    skills: ['SQL', 'Python', 'Machine learning'],
    companies: ['Northwind Labs', 'Helix Health'],
    tone: 'card',
    shape: 'landscape',
  },
  {
    id: 'design-systems-workshop',
    title: 'Design Systems Workshop',
    category: 'Workshop',
    date: 'Fri 20 Jun',
    time: '14:00 – 17:00',
    city: 'Munich',
    venue: 'Tessera HQ',
    online: false,
    going: 64,
    fit: 94,
    fields: ['Design'],
    skills: ['Design systems', 'Figma', 'Prototyping'],
    companies: ['Tessera', 'Atelier Vert'],
    tone: 'lime',
    shape: 'square',
  },
  {
    id: 'growth-brand-panel',
    title: 'Growth & Brand Panel',
    category: 'Panel',
    date: 'Tue 24 Jun',
    time: '17:00 – 19:00',
    city: 'Barcelona',
    venue: 'La Nau',
    online: false,
    going: 148,
    fit: 61,
    fields: ['Marketing', 'Design'],
    skills: ['SEO', 'Content', 'Branding'],
    companies: ['Loop & Co', 'Atelier Vert'],
    tone: 'coral',
    shape: 'portrait',
  },
  {
    id: 'ship-it-hackathon',
    title: 'Ship It: 24h Hackathon',
    category: 'Hackathon',
    date: 'Sat 28 Jun',
    time: '09:00, 24 hours',
    city: 'Zurich',
    venue: 'Technopark',
    online: false,
    going: 305,
    fit: 82,
    fields: ['Engineering', 'Data'],
    skills: ['React', 'Node.js', 'Python', 'Cloud / DevOps'],
    companies: ['Paperplane', 'Quanta Robotics', 'Northwind Labs'],
    tone: 'ink',
    shape: 'landscape',
  },
  {
    id: 'product-leaders-roundtable',
    title: 'Product Leaders Roundtable',
    category: 'Networking',
    date: 'Thu 3 Jul',
    time: '18:00 – 20:30',
    city: 'Amsterdam',
    venue: 'De Hallen',
    online: false,
    going: 92,
    fit: 69,
    fields: ['Product'],
    skills: ['Roadmapping', 'Discovery', 'Analytics'],
    companies: ['Helix Health', 'Paperplane', 'Loop & Co'],
    tone: 'card',
    shape: 'square',
  },

  {
    id: 'frontend-craft-night',
    title: 'Frontend Craft Night',
    category: 'Meetup',
    date: 'Tue 8 Jul',
    time: '18:30 – 21:30',
    city: 'Helsinki',
    venue: 'Maria 01',
    online: false,
    going: 176,
    fit: 91,
    fields: ['Engineering', 'Design'],
    skills: ['React', 'TypeScript', 'Motion'],
    companies: ['Paperplane', 'Tessera'],
    tone: 'forest',
    shape: 'landscape',
  },
  {
    id: 'research-ops-breakfast',
    title: 'Research Ops Breakfast',
    category: 'Networking',
    date: 'Thu 10 Jul',
    time: '08:30 – 10:00',
    city: 'Copenhagen',
    venue: 'BLOX Hub',
    online: false,
    going: 48,
    fit: 77,
    fields: ['Design', 'Product'],
    skills: ['User research', 'Discovery'],
    companies: ['Tessera', 'Helix Health'],
    tone: 'card',
    shape: 'portrait',
  },
  {
    id: 'ml-in-production',
    title: 'ML in Production',
    category: 'Talk',
    date: 'Mon 14 Jul',
    time: '17:30 – 19:30',
    city: 'Online',
    venue: 'Live stream',
    online: true,
    going: 640,
    fit: 58,
    fields: ['Data', 'Engineering'],
    skills: ['Machine learning', 'Python', 'Data engineering'],
    companies: ['Northwind Labs', 'Quanta Robotics'],
    tone: 'ink',
    shape: 'square',
  },
  {
    id: 'brand-in-motion',
    title: 'Brand in Motion',
    category: 'Workshop',
    date: 'Wed 16 Jul',
    time: '13:00 – 17:00',
    city: 'Paris',
    venue: 'Atelier Vert',
    online: false,
    going: 36,
    fit: 86,
    fields: ['Design', 'Marketing'],
    skills: ['Motion', 'Branding', 'Figma'],
    companies: ['Atelier Vert', 'Loop & Co'],
    tone: 'coral',
    shape: 'landscape',
  },
  {
    id: 'climate-data-jam',
    title: 'Climate Data Jam',
    category: 'Hackathon',
    date: 'Sat 19 Jul',
    time: '10:00 – 20:00',
    city: 'Stockholm',
    venue: 'Norrsken House',
    online: false,
    going: 210,
    fit: 72,
    fields: ['Data', 'Engineering'],
    skills: ['SQL', 'Visualisation', 'Python'],
    companies: ['Northwind Labs'],
    tone: 'lime',
    shape: 'portrait',
  },
  {
    id: 'pm-office-hours',
    title: 'PM Office Hours',
    category: 'Mentoring',
    date: 'Tue 22 Jul',
    time: '16:00 – 18:00',
    city: 'Online',
    venue: '1:1 video',
    online: true,
    going: 120,
    fit: 66,
    fields: ['Product'],
    skills: ['Roadmapping', 'Stakeholder mgmt', 'Pricing'],
    companies: ['Helix Health', 'Paperplane'],
    tone: 'card',
    shape: 'landscape',
  },

  {
    id: 'robotics-open-lab',
    title: 'Robotics Open Lab',
    category: 'Open house',
    date: 'Fri 25 Jul',
    time: '15:00 – 19:00',
    city: 'Zurich',
    venue: 'Quanta Works',
    online: false,
    going: 88,
    fit: 54,
    fields: ['Engineering'],
    skills: ['Python', 'Cloud / DevOps', 'Mobile'],
    companies: ['Quanta Robotics'],
    tone: 'forest',
    shape: 'square',
  },
  {
    id: 'creator-economy-summit',
    title: 'Creator Economy Summit',
    category: 'Conference',
    date: 'Tue 5 Aug',
    time: '09:30 – 18:00',
    city: 'Lisbon',
    venue: 'LX Factory',
    online: false,
    going: 920,
    fit: 63,
    fields: ['Marketing', 'Product', 'Engineering'],
    skills: ['Content', 'Paid media', 'Analytics'],
    companies: ['Paperplane', 'Loop & Co'],
    tone: 'coral',
    shape: 'portrait',
  },
  {
    id: 'design-portfolio-reviews',
    title: 'Portfolio Reviews, Live',
    category: 'Mentoring',
    date: 'Thu 7 Aug',
    time: '17:00 – 20:00',
    city: 'Vienna',
    venue: 'MuseumsQuartier',
    online: false,
    going: 72,
    fit: 96,
    fields: ['Design'],
    skills: ['Figma', 'Prototyping', 'Branding'],
    companies: ['Atelier Vert', 'Tessera'],
    tone: 'lime',
    shape: 'landscape',
  },
  {
    id: 'typescript-deep-dive',
    title: 'TypeScript Deep Dive',
    category: 'Workshop',
    date: 'Sat 9 Aug',
    time: '10:00 – 16:00',
    city: 'Online',
    venue: 'Hands-on labs',
    online: true,
    going: 388,
    fit: 84,
    fields: ['Engineering'],
    skills: ['TypeScript', 'React', 'Node.js'],
    companies: ['Paperplane', 'Tessera'],
    tone: 'ink',
    shape: 'portrait',
  },
  {
    id: 'health-tech-careers',
    title: 'Health Tech Careers Day',
    category: 'Career fair',
    date: 'Wed 13 Aug',
    time: '11:00 – 16:00',
    city: 'Amsterdam',
    venue: 'Helix Campus',
    online: false,
    going: 260,
    fit: 71,
    fields: ['Product', 'Data', 'Engineering'],
    skills: ['Discovery', 'Analytics', 'SQL'],
    companies: ['Helix Health', 'Northwind Labs'],
    tone: 'card',
    shape: 'square',
  },
  {
    id: 'growth-lab-barcelona',
    title: 'Growth Lab',
    category: 'Workshop',
    date: 'Fri 15 Aug',
    time: '14:00 – 18:00',
    city: 'Barcelona',
    venue: 'Loop Studio',
    online: false,
    going: 54,
    fit: 47,
    fields: ['Marketing'],
    skills: ['SEO', 'Paid media', 'CRM'],
    companies: ['Loop & Co'],
    tone: 'forest',
    shape: 'portrait',
  },

  {
    id: 'women-in-data',
    title: 'Women in Data Evening',
    category: 'Networking',
    date: 'Tue 19 Aug',
    time: '18:00 – 21:00',
    city: 'Berlin',
    venue: 'Factory Görlitzer Park',
    online: false,
    going: 190,
    fit: 79,
    fields: ['Data'],
    skills: ['Statistics', 'Machine learning', 'Visualisation'],
    companies: ['Northwind Labs', 'Helix Health'],
    tone: 'coral',
    shape: 'square',
  },
  {
    id: 'remote-first-teams',
    title: 'Remote-First Teams',
    category: 'Panel',
    date: 'Thu 21 Aug',
    time: '17:00 – 18:30',
    city: 'Online',
    venue: 'Live panel',
    online: true,
    going: 512,
    fit: 90,
    fields: ['Engineering', 'Product', 'Design'],
    skills: ['Stakeholder mgmt', 'Design systems', 'Cloud / DevOps'],
    companies: ['Paperplane', 'Tessera', 'Northwind Labs'],
    tone: 'lime',
    shape: 'landscape',
  },
  {
    id: 'design-engineers-club',
    title: 'Design Engineers Club',
    category: 'Meetup',
    date: 'Wed 27 Aug',
    time: '18:30 – 21:00',
    city: 'Munich',
    venue: 'Werk1',
    online: false,
    going: 110,
    fit: 93,
    fields: ['Design', 'Engineering'],
    skills: ['Prototyping', 'React', 'Motion'],
    companies: ['Tessera', 'Quanta Robotics'],
    tone: 'ink',
    shape: 'portrait',
  },
  {
    id: 'nordic-startup-fair',
    title: 'Nordic Startup Fair',
    category: 'Career fair',
    date: 'Sat 30 Aug',
    time: '10:00 – 16:00',
    city: 'Helsinki',
    venue: 'Kattilahalli',
    online: false,
    going: 730,
    fit: 81,
    fields: ['Engineering', 'Design', 'Product', 'Marketing'],
    skills: ['React', 'Figma', 'Analytics', 'Content'],
    companies: ['Northwind Labs', 'Paperplane', 'Loop & Co', 'Helix Health'],
    tone: 'forest',
    shape: 'landscape',
  },
  {
    id: 'analytics-engineering-day',
    title: 'Analytics Engineering Day',
    category: 'Conference',
    date: 'Tue 2 Sep',
    time: '09:00 – 17:00',
    city: 'Dublin',
    venue: 'The Digital Hub',
    online: false,
    going: 340,
    fit: 52,
    fields: ['Data'],
    skills: ['SQL', 'Data engineering', 'Visualisation'],
    companies: ['Northwind Labs', 'Helix Health'],
    tone: 'card',
    shape: 'portrait',
  },
  {
    id: 'demo-day-autumn',
    title: 'Autumn Demo Day',
    category: 'Demo day',
    date: 'Thu 4 Sep',
    time: '16:00 – 20:00',
    city: 'Paris',
    venue: 'Station F',
    online: false,
    going: 410,
    fit: 68,
    fields: ['Product', 'Engineering', 'Marketing'],
    skills: ['Experimentation', 'Pricing', 'Mobile'],
    companies: ['Paperplane', 'Quanta Robotics', 'Atelier Vert'],
    tone: 'lime',
    shape: 'square',
  },
]

/** Public URL of an event's generated card image (src/pages/events/[id].webp.ts), below the site's base. */
export const eventImage = (event: Pick<LandingEvent, 'id'>) => sitePath(`/events/${event.id}.webp`)

export type EventFilter = { query: string; onlineOnly: boolean; minFit: number }

const STOP = new Set([
  'a',
  'an',
  'and',
  'any',
  'are',
  'at',
  'for',
  'from',
  'i',
  'im',
  'in',
  'is',
  'looking',
  'me',
  'my',
  'near',
  'of',
  'on',
  'or',
  'show',
  'find',
  'some',
  'that',
  'the',
  'this',
  'to',
  'want',
  'with',
  'event',
  'events',
  'role',
  'roles',
  'job',
  'jobs',
  'next',
  'summer',
  'people',
  'team',
  'teams',
  'where',
])
const ALIASES: Record<string, string> = {
  remote: 'online',
  virtual: 'online',
  designer: 'design',
  designers: 'design',
  developer: 'engineering',
  developers: 'engineering',
  engineer: 'engineering',
  engineers: 'engineering',
  dev: 'engineering',
  frontend: 'react',
  pm: 'product',
  pms: 'product',
  marketer: 'marketing',
  marketers: 'marketing',
  ai: 'machine',
  ml: 'machine',
  june: 'jun',
  july: 'jul',
  august: 'aug',
  september: 'sep',
}
const stem = (word: string) => (word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word)
const words = (text: string) =>
  text
    .toLowerCase()
    // Fold accents ("Zürich" -> "zurich"): drop the combining marks NFKD splits off, so they do
    // not split the word when everything else that is not a letter or digit becomes a space.
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

/** Search terms of a free-text ask: lower-cased, without filler words, with a few synonyms folded. */
export function queryTerms(query: string): string[] {
  const terms = words(query)
    .filter((word) => !STOP.has(word))
    .map((word) => stem(ALIASES[word] ?? word))
  return [...new Set(terms)]
}

const haystacks = new Map<string, string[]>()
function haystack(event: LandingEvent): string[] {
  let hay = haystacks.get(event.id)
  if (!hay) {
    hay = words(
      [
        event.title,
        event.category,
        event.city,
        event.venue,
        event.date,
        event.online ? 'online remote' : '',
        ...event.fields,
        ...event.skills,
        ...event.companies,
      ].join(' '),
    ).map(stem)
    haystacks.set(event.id, hay)
  }
  return hay
}

/** How many of the terms an event answers. A term answers by prefix either way ("hack" ~ "hackathon"). */
function relevance(event: LandingEvent, terms: readonly string[]): number {
  const hay = haystack(event)
  let hits = 0
  for (const term of terms) {
    if (
      hay.some(
        (word) =>
          word === term || (term.length >= 3 && word.startsWith(term)) || (word.length >= 4 && term.startsWith(word)),
      )
    )
      hits++
  }
  return hits
}

/**
 * Events that pass the dock filters and answer the ask, closest answer first, then best fit. With
 * an ask, only the events that answer the most terms are kept (plus near misses when those are
 * few), so "design workshops in Munich" narrows instead of widening.
 */
export function matchEvents(events: readonly LandingEvent[], filter: EventFilter): LandingEvent[] {
  const pool = events.filter((event) => event.fit >= filter.minFit && (!filter.onlineOnly || event.online))
  const terms = queryTerms(filter.query)
  if (!terms.length) return [...pool].sort((a, b) => b.fit - a.fit)
  const scored = pool
    .map((event) => ({ event, hits: relevance(event, terms) }))
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits || b.event.fit - a.event.fit)
  const best = scored[0]?.hits ?? 0
  // A handful of exact answers stands alone; fewer than four bring their near misses along.
  const exact = scored.filter((entry) => entry.hits === best).length
  const floor = exact >= 4 ? best : Math.max(1, best - 1)
  return scored.filter((entry) => entry.hits >= floor).map((entry) => entry.event)
}

/**
 * The one ask whose no-fit flash is full of skulls (SkullWall.tsx), and what the Steve Jobs pill
 * fills in. Written as the ask flow runs an ask (cleanAsk), so typing it brings the skulls too.
 */
export const SKULL_ASK = 'He is dead.'

/** Example profiles offered under the ask box, with the text each pill fills in. */
export const ASK_SUGGESTIONS = [
  { label: 'Jensen Huang', value: 'https://linkedin.com/in/jenhsunhuang/' },
  { label: 'Steve Jobs', value: SKULL_ASK },
  { label: 'Bill Gates', value: 'https://linkedin.com/in/williamhgates/' },
  { label: 'Elon Musk', value: 'https://x.com/elonmusk' },
] as const
