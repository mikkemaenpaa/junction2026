import { describe, expect, it } from 'vite-plus/test'
import { parseFollowers, priorityOf } from './priority.ts'
import { DEFAULT_SETTINGS, select } from './scoring.ts'
import { computeSignals } from './signals.ts'
import { FIELD_IDS } from './types.ts'
import type { FieldId, Source, WorkItem } from './types.ts'

const NOW = new Date().getFullYear()

const source = (platform: string, workItems: WorkItem[] = [], followers?: number): Source => ({
  url: `https://example.com/${platform}`,
  platform,
  basis: platform === 'linkedin' ? 'claimed' : 'verified',
  status: 'ok',
  pages: 1,
  credits: 1,
  fetchedAt: '2026-11-14T00:00:00Z',
  data: { workItems, tools: [], education: [], experience: [], counts: { followers }, commitMessages: [] },
})
const repo = (title: string, stars: number, fork = false): WorkItem => ({
  title,
  tools: ['Rust'],
  year: NOW,
  popularity: stars,
  fork,
})

describe('followers on a LinkedIn page', () => {
  it('reads the short and the exact forms', () => {
    expect(parseFollowers('Bill Gates\n41M followers')).toBe(41_000_000)
    expect(parseFollowers('35K followers 500+ connections')).toBe(35_000)
    expect(parseFollowers('1.5K followers')).toBe(1500)
    expect(parseFollowers('40,816,435 followers - 1,849 Posts')).toBe(40_816_435)
    expect(parseFollowers('812 followers')).toBe(812)
  })

  it('takes the first count on the page, which is the profile’s own', () => {
    expect(parseFollowers('35K followers\n## People also viewed\n74K followers\n7K followers')).toBe(35_000)
  })

  it('finds nothing on a page without one', () => {
    expect(parseFollowers('Sign in to view the full profile')).toBeNull()
  })

  it('reads the way each social site writes it', () => {
    expect(parseFollowers('71.2K posts · 4,355 Following · 428.4K Followers')).toBe(428_400)
    expect(parseFollowers('11.9M followers 317 following')).toBe(11_900_000)
    expect(parseFollowers('### **0**Following **15**Followers **19**Likes')).toBe(15)
    expect(parseFollowers('**Handle**: @theo **Subscribers**: 580K **Videos**: 1.2K')).toBe(580_000)
    expect(parseFollowers('# Bill Gates [**41M** followers] • [**103** following]')).toBe(41_000_000)
  })
})

describe('priority list', () => {
  it('takes more than 5,000 stars on the person’s own repositories', () => {
    expect(priorityOf([source('github', [repo('a', 4000), repo('b', 1500)])])?.reasons).toEqual(['5.5k GitHub stars'])
    expect(priorityOf([source('github', [repo('a', 5000)])])).toBeNull()
    // A fork's stars are someone else's.
    expect(priorityOf([source('github', [repo('a', 100), repo('linux', 180_000, true)])])).toBeNull()
  })

  it('or more than 10,000 followers on LinkedIn, either one being enough', () => {
    expect(priorityOf([source('linkedin', [], 41_000_000)])?.reasons).toEqual(['41M LinkedIn followers'])
    expect(priorityOf([source('linkedin', [], 10_000)])).toBeNull()
    expect(priorityOf([source('github', [repo('a', 11_014)]), source('linkedin', [], 35_000)])?.reasons).toEqual([
      '11k GitHub stars',
      '35k LinkedIn followers',
    ])
  })

  it('has its own threshold for each channel', () => {
    const over: [string, number, string][] = [
      ['tiktok', 100_001, '100k TikTok followers'],
      ['youtube', 580_000, '580k YouTube subscribers'],
      ['facebook', 41_000_000, '41M Facebook followers'],
      ['instagram', 50_001, '50k Instagram followers'],
      ['x', 428_400, '428k X followers'],
    ]
    for (const [platform, followers, reason] of over) {
      expect(priorityOf([source(platform, [], followers)])?.reasons, platform).toEqual([reason])
    }
    const atMost: [string, number][] = [
      ['tiktok', 100_000],
      ['youtube', 70_000],
      ['facebook', 30_000],
      ['instagram', 50_000],
      ['x', 50_000],
    ]
    for (const [platform, followers] of atMost) {
      expect(priorityOf([source(platform, [], followers)]), platform).toBeNull()
    }
  })

  it('counts a LinkedIn post’s author as LinkedIn, and the largest count per channel', () => {
    expect(priorityOf([source('linkedin-post', [], 12_000)])?.reasons).toEqual(['12k LinkedIn followers'])
    expect(priorityOf([source('x', [], 60_000), source('x', [], 900)])?.followers).toEqual({ x: 60_000 })
  })

  it('does not count followers on channels without a threshold', () => {
    expect(priorityOf([source('medium', [], 50_000)])).toBeNull()
    expect(priorityOf([source('snapchat', [], 11_000_000)])).toBeNull()
  })
})

describe('priority in the selection', () => {
  const shares = Object.fromEntries(FIELD_IDS.map((f) => [f, f === 'embedded' ? 1 : 0])) as Record<FieldId, number>
  const settings = { ...DEFAULT_SETTINGS, count: 3 }
  const firmware = (id: string, repos: number) => {
    const sources = [
      source(
        'github',
        Array.from({ length: repos }, (_, i) => repo(`firmware-${id}-${i}`, 0)),
      ),
    ]
    return {
      id,
      declaredFields: ['embedded'] as FieldId[],
      signals: computeSignals(sources, NOW),
      priority: priorityOf(sources),
    }
  }
  // Famous for work outside the event's fields: no evidence in any field, so a score of zero.
  const famousSources = [source('linkedin', [], 41_000_000)]
  const famous = {
    id: 'famous',
    declaredFields: [] as FieldId[],
    signals: computeSignals(famousSources, NOW),
    priority: priorityOf(famousSources),
  }
  const others = [firmware('a', 12), firmware('b', 8), firmware('c', 4)]

  it('puts a priority applicant first, even with a score of zero', () => {
    const { suggestions } = select([...others, famous], settings, shares)
    expect(suggestions[0]!.applicant.id).toBe('famous')
    expect(suggestions[0]!.score).toBe(0)
  })

  it('takes the place from the lowest score, keeping the number of suggestions', () => {
    const without = select(others, settings, shares).suggestions.map((s) => s.applicant.id)
    const withFamous = select([...others, famous], settings, shares).suggestions.map((s) => s.applicant.id)
    expect(without).toEqual(['a', 'b', 'c'])
    expect(withFamous).toEqual(['famous', 'a', 'b'])
  })
})
