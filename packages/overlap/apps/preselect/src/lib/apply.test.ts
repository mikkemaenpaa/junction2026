import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { POST } from '../pages/api/apply.ts'
import { collectApplicant } from './collect.ts'
import { computeSignals } from './signals.ts'
import { readApplicants, readCompanies, saveApplicant } from './store.ts'
import type { Applicant, Source } from './types.ts'

vi.mock('./collect.ts', () => ({ collectApplicant: vi.fn() }))
vi.mock('./store.ts', () => ({ readApplicants: vi.fn(), readCompanies: vi.fn(), saveApplicant: vi.fn() }))

const good = (): Source => ({
  url: 'https://github.com/ada',
  platform: 'github',
  basis: 'verified',
  status: 'ok',
  pages: 1,
  credits: 1,
  fetchedAt: new Date().toISOString(),
  data: {
    headline: 'Firmware engineer',
    workItems: [],
    tools: ['Rust'],
    education: [],
    experience: [],
    counts: {},
    commitMessages: [],
  },
})
function applicant(sources: Source[] = [good()]): Applicant {
  return {
    id: 'existing-id',
    alias: 'Applicant 001',
    links: sources.map((s) => s.url),
    hasCv: false,
    declaredFields: ['embedded'],
    sources,
    signals: computeSignals(sources),
    createdAt: '2025-01-01T00:00:00Z',
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(readApplicants).mockReturnValue([])
  vi.mocked(readCompanies).mockReturnValue([])
  vi.mocked(collectApplicant).mockImplementation(async (input) => ({
    ...applicant(),
    id: 'new-id',
    links: input.links,
    declaredFields: input.declaredFields,
  }))
})

async function post(body: object) {
  const response = await POST({
    request: new Request('http://localhost/api/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  } as Parameters<typeof POST>[0])
  expect(response.status).toBe(200)
  return response.json()
}

describe('updating an application', () => {
  it('updates the chosen fields while reusing fresh successful sources', async () => {
    const old = applicant()
    vi.mocked(readApplicants).mockReturnValue([old])
    const response = await post({ links: old.links, fields: ['ai'] })
    expect(response.id).toBe(old.id)
    expect(response.applicant).toBeUndefined()
    expect(response.companies).toEqual([])
    expect(collectApplicant).not.toHaveBeenCalled()
    expect(saveApplicant).toHaveBeenCalledWith(expect.objectContaining({ id: old.id, declaredFields: ['ai'] }))
  })

  it.each(['failed', 'partial', 'stale', 'invalid-date', 'missing-sources', 'explicit-refresh'])(
    'reads the sources again for %s, keeping the existing applicant identity',
    async (reason) => {
      const old = applicant()
      if (reason === 'failed') old.sources[0]!.status = 'failed'
      if (reason === 'partial') old.sources[0]!.error = 'REPOSITORY_NOT_READABLE'
      if (reason === 'stale') old.sources[0]!.fetchedAt = '2020-01-01T00:00:00Z'
      if (reason === 'invalid-date') old.sources[0]!.fetchedAt = 'invalid'
      if (reason === 'missing-sources') old.sources = []
      vi.mocked(readApplicants).mockReturnValue([old])
      const response = await post({ links: old.links, fields: ['ai'], refresh: reason === 'explicit-refresh' })
      expect(collectApplicant).toHaveBeenCalledOnce()
      expect(response.id).toBe(old.id)
      expect(saveApplicant).toHaveBeenCalledWith(
        expect.objectContaining({ id: old.id, alias: old.alias, createdAt: old.createdAt, declaredFields: ['ai'] }),
      )
    },
  )

  it('retries a failed source even when another source succeeded', async () => {
    const old = applicant([
      good(),
      { ...good(), url: 'https://ada.dev', platform: 'web', status: 'failed', error: 'REQUEST_TIMEOUT' },
    ])
    vi.mocked(readApplicants).mockReturnValue([old])
    await post({ links: old.links, fields: ['embedded'] })
    expect(collectApplicant).toHaveBeenCalledOnce()
  })
})
