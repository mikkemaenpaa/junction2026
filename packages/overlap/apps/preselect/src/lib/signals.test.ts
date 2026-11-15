import { describe, expect, it } from 'vite-plus/test'
import { DEFAULT_SETTINGS, scoreField } from './scoring.ts'
import { computeSignals } from './signals.ts'
import { FIELD_IDS } from './types.ts'
import type { Source, WorkItem } from './types.ts'

const work: WorkItem = {
  title: 'Sensor firmware',
  url: 'https://github.com/ada/sensor',
  tools: ['Rust'],
  year: 2025,
  popularity: 25,
  fieldRelevance: { embedded: 1 },
}
const source = (url: string, platform: string, items: WorkItem[], basis: Source['basis'] = 'verified'): Source => ({
  url,
  platform,
  basis,
  status: 'ok',
  pages: 1,
  credits: 1,
  fetchedAt: '2026-11-14T00:00:00Z',
  data: {
    workItems: items,
    tools: [],
    education: [],
    experience: [],
    counts: { workItems: items.length },
    commitMessages: [],
  },
})
const score = (sources: Source[]) =>
  scoreField({ declaredFields: [], signals: computeSignals(sources, 2026) }, 'embedded', DEFAULT_SETTINGS).score

describe('work shared by multiple sources', () => {
  const github = source('https://github.com/ada', 'github', [work])
  const website = source('https://ada.dev', 'web', [
    { ...work, url: 'https://www.github.com/ADA/sensor/?utm_source=portfolio#readme' },
  ])

  it('counts the same project and its reach once, independent of source order', () => {
    for (const sources of [
      [github, website],
      [website, github],
    ]) {
      const signals = computeSignals(sources, 2026)
      expect(signals.portfolio.verifiedItems).toBe(1)
      expect(signals.portfolio.listedVerified).toBe(1)
      expect(signals.portfolio.popularity).toBe(25)
      expect(signals.tools.find((t) => t.tool === 'Rust')?.verifiedItems).toBe(1)
      expect(score(sources)).toBe(score([github]))
    }
  })

  it('prefers work read at its own host to a third-party account of the same work', () => {
    const claimed = source('cv', 'cv', [{ ...work, tools: ['Python'] }], 'claimed')
    const copy = source('https://ada.dev', 'web', [{ ...work, fieldRelevance: { ai: 1 } }])
    const signals = computeSignals([claimed, copy, github], 2026)
    expect(signals.portfolio.claimedItems).toBe(0)
    expect(signals.fieldItems.embedded.verified).toBe(1)
    expect(signals.fieldItems.ai.verified).toBe(0)
  })

  it('does not conflate different URLs or projects that have no URL', () => {
    const items = [
      work,
      { ...work, url: 'https://github.com/ada/other' },
      { ...work, url: null },
      { ...work, url: null },
    ]
    expect(computeSignals([source('https://ada.dev', 'web', items)], 2026).portfolio.verifiedItems).toBe(4)
  })

  it('preserves case-sensitive paths and meaningful query parameters on other hosts', () => {
    const items = ['https://ada.dev/A', 'https://ada.dev/a', 'https://ada.dev/p?id=1', 'https://ada.dev/p?id=2'].map(
      (url) => ({ ...work, url }),
    )
    expect(computeSignals([source('https://ada.dev', 'web', items)], 2026).portfolio.verifiedItems).toBe(4)
  })

  it('keeps the source evidence unchanged', () => {
    const before = JSON.stringify([github, website])
    computeSignals([github, website], 2026)
    expect(JSON.stringify([github, website])).toBe(before)
  })
})

describe('model judgement and platform fallback', () => {
  const zero = Object.fromEntries(FIELD_IDS.map((field) => [field, 0]))
  it.each(['kaggle', 'huggingface', 'scholar', 'orcid', 'hackaday'])(
    'respects an all-zero judgement on %s',
    (platform) => {
      const signals = computeSignals([
        source(`https://${platform}.example`, platform, [{ title: 'Holiday photos', tools: [], fieldRelevance: zero }]),
      ])
      for (const field of FIELD_IDS) expect(signals.fieldItems[field].verified).toBe(0)
    },
  )

  it('uses the platform when no model judgement exists', () => {
    const signals = computeSignals([
      source('https://kaggle.com/ada', 'kaggle', [{ title: 'Untitled notebook', tools: [] }]),
    ])
    expect(signals.fieldItems.ai.verified).toBe(1)
  })
})
