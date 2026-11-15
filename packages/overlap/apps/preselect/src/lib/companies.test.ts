import { describe, expect, it } from 'vite-plus/test'
import { companyFit, prepareCompanies, workText } from './companies.ts'
import { DEFAULT_SETTINGS, scoreField } from './scoring.ts'
import { computeSignals } from './signals.ts'
import type { Company, Source, WorkItem } from './types.ts'

const NOW = new Date().getFullYear()

const source = (platform: string, basis: Source['basis'], workItems: WorkItem[]): Source => ({
  url: `https://example.com/${platform}`,
  platform,
  basis,
  status: 'ok',
  pages: 1,
  credits: 1,
  fetchedAt: '2026-11-14T00:00:00Z',
  data: { workItems, tools: [], education: [], experience: [], counts: {}, commitMessages: [] },
})

const company = (name: string, fields: Company['fields'], soughtSkills: string[] = []): Company => ({
  name,
  url: `https://${name.toLowerCase()}.example`,
  status: 'ok',
  fields,
  soughtSkills,
})

const COMPANIES = prepareCompanies([
  company('Radio', { embedded: 0.9, semiconductors: 0.1 }, ['Zephyr', 'Bluetooth LE', 'low-power wireless protocols']),
  company('Boards', { embedded: 1 }),
  company('Deals', { business: 1 }, ['Technical sales']),
])

const fitOf = (sources: Source[]) => {
  const signals = computeSignals(sources, NOW)
  return { signals, fit: companyFit(signals, workText({ sources }), COMPANIES) }
}

const firmware = (title: string, description = ''): WorkItem => ({ title, description, tools: ['C'], year: NOW })
const plain = fitOf([
  source(
    'github',
    'verified',
    Array.from({ length: 8 }, (_, i) => firmware(`stm32-driver-${i}`)),
  ),
])
const specific = fitOf([
  source(
    'github',
    'verified',
    Array.from({ length: 8 }, (_, i) =>
      firmware(`sensor-node-${i}`, 'Zephyr firmware for a Bluetooth LE sensor with low-power wireless protocols'),
    ),
  ),
])
const cook = fitOf([source('web', 'verified', [{ title: 'Sourdough through the seasons', tools: [], year: NOW }])])

describe('match with companies', () => {
  it('names the companies in the applicant’s fields, best fit first', () => {
    expect(plain.fit.matches.map((m) => m.name)).toEqual(['Boards', 'Radio'])
    expect(plain.fit.matchCount).toBe(2)
  })

  it('fits a company better when the applicant has what it looks for, and says what is shared', () => {
    const radio = (fit: typeof plain.fit) => fit.matches.find((m) => m.name === 'Radio')!
    expect(radio(specific.fit).fit).toBeGreaterThan(radio(plain.fit).fit)
    expect(radio(specific.fit).shared).toEqual(['Zephyr', 'Bluetooth LE', 'low-power wireless protocols'])
    expect(specific.fit.part).toBeGreaterThan(plain.fit.part)
  })

  it('gives nothing to someone outside the companies’ fields', () => {
    expect(cook.fit).toEqual({ part: 0, matches: [], matchCount: 0 })
  })

  it('raises the score through its slider and leaves it alone at zero', () => {
    const score = (companyFit: number, weight: number) =>
      scoreField({ declaredFields: ['embedded'], signals: specific.signals, companyFit }, 'embedded', {
        ...DEFAULT_SETTINGS,
        weights: { ...DEFAULT_SETTINGS.weights, companyFit: weight },
      }).score
    expect(score(0.9, 70)).toBeGreaterThan(score(0.1, 70))
    expect(score(0.9, 0)).toBe(score(0.1, 0))
  })
})
