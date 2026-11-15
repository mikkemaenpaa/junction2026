import { describe, expect, it } from 'vite-plus/test'

import {
  ASK_SUGGESTIONS,
  EVENT_SHAPES,
  EVENTS,
  SKULL_ASK,
  eventImage,
  matchEvents,
  queryTerms,
  type EventFilter,
  type EventTone,
  type LandingEvent,
} from '@/data/events'

/** The dock's initial filters (DEFAULT_FILTERS in src/components/landing/use-ask-flow.ts). */
const DEFAULTS: Omit<EventFilter, 'query'> = { minFit: 40, onlineOnly: false }

const ids = (events: readonly LandingEvent[]) => events.map((event) => event.id)

// Fixture events. events.ts caches each event's search words by id, so every fixture gets a new id.
let fixtures = 0
function fixture(overrides: Partial<Omit<LandingEvent, 'id'>>): LandingEvent {
  fixtures += 1
  return {
    id: `fixture-${fixtures}`,
    title: 'Gathering',
    category: 'Session',
    date: 'Mon 5 Jan',
    time: '10:00 – 11:00',
    city: 'Nowhere',
    venue: 'Hall',
    online: false,
    going: 0,
    fit: 50,
    fields: [],
    skills: [],
    companies: [],
    tone: 'card',
    shape: 'square',
    ...overrides,
  }
}

describe('queryTerms', () => {
  it('lower-cases, drops filler words and folds plurals', () => {
    expect(queryTerms('Design workshops in Munich')).toEqual(['design', 'workshop', 'munich'])
    expect(queryTerms('Data meetups online')).toEqual(['data', 'meetup', 'online'])
  })

  it('only folds plurals of words longer than four letters', () => {
    expect(queryTerms('news bus')).toEqual(['news', 'bus'])
  })

  it('maps synonyms to the words the events use', () => {
    expect(queryTerms('remote')).toEqual(['online'])
    expect(queryTerms('Designers')).toEqual(['design'])
    expect(queryTerms('ML')).toEqual(['machine'])
    expect(queryTerms('PMs')).toEqual(['product'])
    expect(queryTerms('July')).toEqual(['jul'])
  })

  it('returns each term once', () => {
    expect(queryTerms('remote, virtual or online?')).toEqual(['online'])
  })

  it('returns nothing for filler words and punctuation alone', () => {
    expect(queryTerms('')).toEqual([])
    expect(queryTerms('  Show me the events!  ')).toEqual([])
  })

  // NFKD splits "ü" into "u" + a combining mark; the mark must be dropped, not turned into a space.
  it('folds accented letters instead of splitting the word', () => {
    expect(queryTerms('Zürich')).toEqual(['zurich'])
  })
})

describe('matchEvents', () => {
  describe('without an ask', () => {
    it('keeps the events at or above minFit, best fit first', () => {
      const result = matchEvents(EVENTS, { query: '', minFit: 80, onlineOnly: false })
      expect(result.length).toBeGreaterThan(0)
      expect(result).toHaveLength(EVENTS.filter((event) => event.fit >= 80).length)
      const fits = result.map((event) => event.fit)
      expect(fits.every((fit) => fit >= 80)).toBe(true)
      expect(fits).toEqual(fits.toSorted((a, b) => b - a))
    })

    it('includes an event whose fit equals minFit', () => {
      const exact = fixture({ fit: 60 })
      const below = fixture({ fit: 59 })
      expect(matchEvents([below, exact], { query: '', minFit: 60, onlineOnly: false })).toEqual([exact])
    })

    it('keeps only online events with onlineOnly', () => {
      const result = matchEvents(EVENTS, { query: '', minFit: 0, onlineOnly: true })
      expect(result.length).toBeGreaterThan(0)
      expect(result).toHaveLength(EVENTS.filter((event) => event.online).length)
      expect(result.every((event) => event.online)).toBe(true)
    })

    it('returns every event with minFit 0 and leaves the input untouched', () => {
      const before = ids(EVENTS)
      expect(matchEvents(EVENTS, { query: '', minFit: 0, onlineOnly: false })).toHaveLength(EVENTS.length)
      expect(ids(EVENTS)).toEqual(before)
    })

    it('returns nothing when no event reaches minFit', () => {
      expect(matchEvents(EVENTS, { query: '', minFit: 101, onlineOnly: false })).toEqual([])
    })
  })

  describe('with an ask', () => {
    it('ranks by the number of terms answered, then by fit', () => {
      const both = fixture({ title: 'Alpha Beta', fit: 55 })
      const alphaHigh = fixture({ title: 'Alpha', fit: 99 })
      const betaLow = fixture({ title: 'Beta', fit: 70 })
      const neither = fixture({ title: 'Gamma', fit: 100 })
      const result = matchEvents([neither, betaLow, both, alphaHigh], { query: 'alpha beta', ...DEFAULTS })
      expect(result).toEqual([both, alphaHigh, betaLow])
    })

    it('narrows to the exact answers when there are four or more', () => {
      const exact = [80, 70, 60, 50].map((fit) => fixture({ title: 'Alpha Beta', fit }))
      const nearMiss = fixture({ title: 'Alpha', fit: 99 })
      expect(matchEvents([nearMiss, ...exact], { query: 'alpha beta', ...DEFAULTS })).toEqual(exact)
    })

    it('brings near misses along when there are fewer than four exact answers', () => {
      const exact = [80, 70, 60].map((fit) => fixture({ title: 'Alpha Beta', fit }))
      const nearMiss = fixture({ title: 'Beta', fit: 99 })
      expect(matchEvents([nearMiss, ...exact], { query: 'alpha beta', ...DEFAULTS })).toEqual([...exact, nearMiss])
    })

    it('counts a near miss as one term short of the best answer, not any partial answer', () => {
      const three = fixture({ title: 'Alpha Beta Gamma' })
      const two = fixture({ title: 'Alpha Beta' })
      const one = fixture({ title: 'Alpha' })
      expect(matchEvents([one, two, three], { query: 'alpha beta gamma', ...DEFAULTS })).toEqual([three, two])
    })

    it('matches every searchable field, and prefixes both ways', () => {
      const hackathon = fixture({ category: 'Hackathon' })
      const company = fixture({ companies: ['Quanta Robotics'] })
      const skill = fixture({ skills: ['TypeScript'] })
      const online = fixture({ online: true })
      const filter = (query: string) => matchEvents([hackathon, company, skill, online], { query, ...DEFAULTS })
      expect(filter('hack')).toEqual([hackathon]) // the term is a prefix of the word
      expect(filter('hackathons')).toEqual([hackathon])
      expect(filter('quanta')).toEqual([company])
      expect(filter('typescripting')).toEqual([skill]) // the word is a prefix of the term
      expect(filter('remote')).toEqual([online])
    })

    it('applies minFit and onlineOnly before matching', () => {
      const lowFit = fixture({ title: 'Alpha', fit: 30 })
      const inPerson = fixture({ title: 'Alpha', fit: 90 })
      const online = fixture({ title: 'Alpha', fit: 45, online: true })
      const events = [lowFit, inPerson, online]
      expect(matchEvents(events, { query: 'alpha', minFit: 40, onlineOnly: false })).toEqual([inPerson, online])
      expect(matchEvents(events, { query: 'alpha', minFit: 40, onlineOnly: true })).toEqual([online])
      expect(matchEvents(events, { query: 'alpha', minFit: 95, onlineOnly: false })).toEqual([])
    })

    it('returns an empty list when nothing answers the ask', () => {
      expect(matchEvents(EVENTS, { query: 'xyzzy', ...DEFAULTS })).toEqual([])
      expect(matchEvents([fixture({ title: 'Alpha' })], { query: 'beta', ...DEFAULTS })).toEqual([])
    })

    it('narrows the demo events to the closest answers', () => {
      const design = matchEvents(EVENTS, { query: 'design', ...DEFAULTS })
      const result = matchEvents(EVENTS, { query: 'Design workshops in Munich', ...DEFAULTS })
      // The only design workshop in Munich comes first; the rest answer two of the three terms.
      expect(result[0]?.id).toBe('design-systems-workshop')
      expect(result.length).toBeGreaterThan(1)
      expect(result.length).toBeLessThan(design.length)
    })

    it('finds events when the ask has accents the data does not', () => {
      const zurich = ids(matchEvents(EVENTS, { query: 'Zurich', ...DEFAULTS }))
      expect(zurich.length).toBeGreaterThan(0)
      expect(ids(matchEvents(EVENTS, { query: 'Zürich', ...DEFAULTS }))).toEqual(zurich)
      // And the other way round: the data has the accent ("Factory Görlitzer Park"), the ask does not.
      expect(ids(matchEvents(EVENTS, { query: 'Gorlitzer', ...DEFAULTS }))).toEqual(['women-in-data'])
    })
  })
})

describe('SKULL_ASK', () => {
  it('is what the Steve Jobs pill fills in', () => {
    expect(ASK_SUGGESTIONS.find(({ label }) => label === 'Steve Jobs')?.value).toBe(SKULL_ASK)
  })

  // Only an ask that fits nothing ends in the flash, so if the search ever answered it the skulls
  // would never show.
  it('fits no event, with the default filters or the loosest ones', () => {
    for (const filters of [DEFAULTS, { minFit: 0, onlineOnly: false }])
      expect(matchEvents(EVENTS, { query: SKULL_ASK, ...filters })).toEqual([])
  })
})

describe('EVENTS', () => {
  // A Record, so the type checker fails this file when a tone is added or removed.
  const TONES: Record<EventTone, true> = { forest: true, card: true, lime: true, coral: true, ink: true }

  it('has unique ids', () => {
    expect(new Set(ids(EVENTS)).size).toBe(EVENTS.length)
  })

  it.each(EVENTS)('$id is valid', (event) => {
    // Lower-case kebab case: used as is in URLs (eventImage) and file names.
    expect(event.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    expect(encodeURIComponent(event.id)).toBe(event.id)
    expect(new URL(eventImage(event), 'https://example.com').pathname).toBe(`/events/${event.id}.webp`)
    expect(Number.isInteger(event.fit)).toBe(true)
    expect(event.fit).toBeGreaterThanOrEqual(0)
    expect(event.fit).toBeLessThanOrEqual(100)
    expect(Object.keys(TONES)).toContain(event.tone)
    expect(Object.keys(EVENT_SHAPES)).toContain(event.shape)
  })
})
