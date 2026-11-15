import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { collectApplicant } from './collect.ts'
import { parseFile } from './contextdev.ts'
import { toView } from './view.ts'

vi.mock('./contextdev.ts', () => ({ parseFile: vi.fn(), scrape: vi.fn(), enrichPerson: vi.fn() }))
afterEach(() => vi.clearAllMocks())

async function collect(markdown: string) {
  vi.mocked(parseFile).mockResolvedValue({ markdown, credits: 2 })
  return collectApplicant({ links: [], declaredFields: [], cv: { bytes: new Uint8Array(), extension: 'pdf' } })
}

describe('CV collection', () => {
  it('retains the exact conversion for re-parsing without returning it in the organiser view', async () => {
    const markdown = 'Experience\nEngineer, Example Oy 01/2020–06/2023\nBuilt firmware using Rust.'
    const applicant = await collect(markdown)
    expect(applicant.sources[0]).toMatchObject({ status: 'ok', markdown, credits: 2 })
    expect(applicant.sources[0]?.data?.experience[0]).toMatchObject({ startYear: 2020, endYear: 2023 })
    expect(applicant.signals.tools.find((t) => t.tool === 'Rust')).toMatchObject({
      claimed: true,
      verifiedItems: 0,
      statedWeight: 0.3,
    })
    expect(JSON.stringify(toView(applicant, []))).not.toContain(markdown)
    expect(toView(applicant, []).sources[0]).not.toHaveProperty('markdown')
  })

  it.each([
    ['', 'NO_TEXT_IN_FILE'],
    ['   \n', 'NO_TEXT_IN_FILE'],
    ['Jane Example\njane@example.org', 'NO_CV_DATA'],
    ['<!-- page 1 -->', 'NO_CV_DATA'],
  ])('does not report a successful CV extraction for %j', async (markdown, error) => {
    const applicant = await collect(markdown)
    expect(applicant.sources[0]).toMatchObject({ status: 'failed', error, markdown, credits: 2 })
    expect(toView(applicant, []).sources[0]).toMatchObject({ ok: false, error })
  })

  it('does not count education dates as years of work', async () => {
    const applicant = await collect('Koulutus\nAalto-yliopisto 2018–2023\nDiplomi-insinööri, tietotekniikka')
    expect(applicant.signals.experience.years).toBe(0)
  })

  it('keeps a failed conversion from aborting the application', async () => {
    vi.mocked(parseFile).mockRejectedValue(new Error('Conversion failed'))
    const applicant = await collectApplicant({
      links: [],
      declaredFields: [],
      cv: { bytes: new Uint8Array(), extension: 'pdf' },
    })
    expect(applicant.sources[0]).toMatchObject({ status: 'failed', error: 'Conversion failed' })
  })
})
