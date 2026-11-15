import { describe, expect, it } from 'vite-plus/test'
import { DEFAULT_SETTINGS, QUOTA_FLOOR, apportion, bestField, fieldShares, scoreField, select } from './scoring.ts'
import { computeSignals } from './signals.ts'
import { FIELD_IDS } from './types.ts'
import type { Company, FieldId, Settings, Source, SourceData, WorkItem } from './types.ts'

const NOW = new Date().getFullYear()

const data = (part: Partial<SourceData>): SourceData => ({
  workItems: [],
  tools: [],
  education: [],
  experience: [],
  counts: {},
  commitMessages: [],
  ...part,
})

const source = (platform: string, basis: Source['basis'], part: Partial<SourceData>): Source => ({
  url: `https://example.com/${platform}`,
  platform,
  basis,
  status: 'ok',
  pages: 1,
  credits: 1,
  fetchedAt: '2026-11-14T00:00:00Z',
  data: data(part),
})

const repo = (title: string, language: string, year = NOW): WorkItem => ({
  title,
  tools: [language],
  year,
  languages: { [language]: 1 },
})

const applicant = (declaredFields: FieldId[], sources: Source[]) => ({
  declaredFields,
  signals: computeSignals(sources, NOW),
})

const rustRepos = Array.from({ length: 12 }, (_, i) => repo(`firmware-${i}`, 'Rust', NOW - (i % 5)))
const embeddedDeveloper = applicant(
  ['embedded'],
  [
    source('github', 'verified', {
      workItems: rustRepos,
      counts: { contributionsLastYear: 1500, activeDaysLastYear: 220, activeSinceYear: NOW - 6 },
    }),
  ],
)

const furFarmer = applicant(
  ['embedded'],
  [
    source('cv', 'claimed', {
      headline: 'Fur farmer',
      experience: [{ title: 'Fur farmer', organization: 'Family farm', startYear: NOW - 20, endYear: null }],
      education: [{ degree: 'Vocational qualification in agriculture', field: 'agriculture' }],
    }),
    source('web', 'verified', { workItems: [{ title: 'Our farm through the seasons', tools: [], year: NOW }] }),
  ],
)

describe('scoring', () => {
  it('puts a large portfolio in the field far above an unrelated background', () => {
    const developer = scoreField(embeddedDeveloper, 'embedded', DEFAULT_SETTINGS)
    const farmer = scoreField(furFarmer, 'embedded', DEFAULT_SETTINGS)
    expect(developer.score).toBeGreaterThan(40)
    expect(farmer.score).toBe(0)
  })

  it('does not let long unrelated experience win when only experience counts', () => {
    const onlyExperience: Settings = {
      ...DEFAULT_SETTINGS,
      weights: { experience: 100, portfolio: 0, toolBreadth: 0, toolDepth: 0, education: 0, companyFit: 0 },
    }
    expect(scoreField(furFarmer, 'embedded', onlyExperience).score).toBeLessThan(
      scoreField(embeddedDeveloper, 'embedded', onlyExperience).score,
    )
  })

  it('raises a stated skill to the maximum when the whole portfolio confirms it', () => {
    const github = source('github', 'verified', { workItems: [repo('key-counter', 'Rust')] })
    const cv = source('cv', 'claimed', { tools: ['Rust'] })
    const shown = computeSignals([github], NOW).tools.find((t) => t.tool === 'Rust')!
    const shownAndStated = computeSignals([github, cv], NOW).tools.find((t) => t.tool === 'Rust')!
    const statedOnly = computeSignals([cv], NOW).tools.find((t) => t.tool === 'Rust')!
    expect(shownAndStated.strength).toBe(1)
    expect(shown.strength).toBeLessThan(1)
    expect(statedOnly.strength).toBeLessThan(0.2)
  })

  it('gives work mentioned only in a CV far less weight than work in a portfolio', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      title: `STM32 firmware project ${i}`,
      tools: ['C'],
      year: NOW,
    }))
    const shown = applicant(['embedded'], [source('github', 'verified', { workItems: items })])
    const stated = applicant(['embedded'], [source('cv', 'claimed', { workItems: items })])
    expect(scoreField(stated, 'embedded', DEFAULT_SETTINGS).score).toBeLessThan(
      scoreField(shown, 'embedded', DEFAULT_SETTINGS).score / 2,
    )
  })

  it('follows the education slider', () => {
    const papers = Array.from({ length: 5 }, (_, i) => ({
      title: `Superconducting qubit readout ${i}`,
      tools: [],
      year: NOW,
    }))
    const withDegree = (degree: string, field: string) =>
      applicant(
        ['quantum'],
        [
          source('scholar', 'verified', { workItems: papers }),
          source('cv', 'claimed', { education: [{ degree, field }] }),
        ],
      )
    const doctor = withDegree('PhD in Physics', 'physics')
    const bachelor = withDegree('BSc in Physics', 'physics')
    const onlyEducation: Settings = {
      ...DEFAULT_SETTINGS,
      weights: { experience: 0, portfolio: 0, toolBreadth: 0, toolDepth: 0, education: 100, companyFit: 0 },
    }
    const noEducation: Settings = { ...DEFAULT_SETTINGS, weights: { ...DEFAULT_SETTINGS.weights, education: 0 } }
    expect(scoreField(doctor, 'quantum', onlyEducation).score).toBeGreaterThan(
      scoreField(bachelor, 'quantum', onlyEducation).score,
    )
    expect(scoreField(doctor, 'quantum', noEducation).score).toBe(scoreField(bachelor, 'quantum', noEducation).score)
  })

  it('scores the chosen skill when the organiser picks one for depth', () => {
    const focusRust: Settings = { ...DEFAULT_SETTINGS, focusTool: 'Rust' }
    const focusVerilog: Settings = { ...DEFAULT_SETTINGS, focusTool: 'Verilog' }
    expect(scoreField(embeddedDeveloper, 'embedded', focusRust).parts.toolDepth).toBeGreaterThan(0.5)
    expect(scoreField(embeddedDeveloper, 'embedded', focusVerilog).parts.toolDepth).toBe(0)
  })
})

describe('places per field', () => {
  const company = (fields: Company['fields']): Company => ({
    name: 'Co',
    url: 'https://example.com',
    status: 'ok',
    fields,
    soughtSkills: [],
  })

  it("splits places by the companies' fields", () => {
    const shares = fieldShares([...Array.from({ length: 9 }, () => company({ space: 1 })), company({ ai: 1 })])
    expect(shares.space).toBeCloseTo(0.9)
    const slots = apportion(20, shares)
    expect(slots.space).toBe(18)
    expect(slots.ai).toBe(2)
    expect(FIELD_IDS.reduce((sum, f) => sum + slots[f], 0)).toBe(20)
  })

  it('always hands out exactly the requested number of places', () => {
    const shares = fieldShares([
      company({ ai: 0.5, research: 0.3, business: 0.2 }),
      company({ quantum: 0.55, ai: 0.25, research: 0.2 }),
      company({ photonics: 1 }),
    ])
    for (const count of [1, 7, 20, 500, 1000]) {
      const slots = apportion(count, shares)
      expect(FIELD_IDS.reduce((sum, f) => sum + slots[f], 0)).toBe(count)
    }
  })

  it("fills each field's places with its best applicants and passes unused places on", () => {
    const developers = Array.from({ length: 5 }, () => embeddedDeveloper)
    const shares = fieldShares([company({ embedded: 0.5, quantum: 0.5 })])
    const selection = select([...developers, furFarmer], { ...DEFAULT_SETTINGS, count: 4 }, shares)
    // Two places each; nobody applies in quantum, so its two places go to embedded as well.
    expect(selection.slots.embedded).toBe(2)
    expect(selection.suggestions).toHaveLength(4)
    expect(selection.suggestions.filter((s) => s.overflow)).toHaveLength(2)
    expect(selection.suggestions.every((s) => s.score >= QUOTA_FLOOR)).toBe(true)
  })

  it('lets an applicant compete in the best of the fields they picked', () => {
    const both = { ...embeddedDeveloper, declaredFields: ['quantum', 'embedded'] as FieldId[] }
    expect(bestField(both, DEFAULT_SETTINGS).field).toBe('embedded')
  })
})

describe('fields judged by a model', () => {
  const tooling = (fieldRelevance?: WorkItem['fieldRelevance']) =>
    applicant(
      ['embedded'],
      [
        source('github', 'verified', {
          workItems: Array.from({ length: 10 }, (_, i) => ({ ...repo(`cli-tool-${i}`, 'Python'), fieldRelevance })),
        }),
      ],
    )

  it('decide which field a piece of work counts for, instead of the words in it', () => {
    // By its words alone a Python repository counts for every field Python is used in.
    expect(tooling().signals.fieldItems.embedded.verified).toBe(10)
    expect(tooling({ embedded: 0, ai: 0.2 }).signals.fieldItems.embedded.verified).toBe(0)
    expect(scoreField(tooling({ embedded: 0, ai: 0.2 }), 'embedded', DEFAULT_SETTINGS).score).toBe(0)
  })

  it('count work by how much it is in the field', () => {
    const squarely = tooling({ embedded: 0.75 })
    const partly = tooling({ embedded: 0.56 })
    expect(squarely.signals.fieldItems.embedded.verified).toBe(10)
    expect(partly.signals.fieldItems.embedded.verified).toBeCloseTo(8)
    expect(scoreField(squarely, 'embedded', DEFAULT_SETTINGS).score).toBeGreaterThan(
      scoreField(partly, 'embedded', DEFAULT_SETTINGS).score,
    )
  })
})
