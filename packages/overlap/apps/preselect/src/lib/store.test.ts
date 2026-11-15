import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vite-plus/test'
import { computeSignals } from './signals.ts'
import type { Applicant } from './types.ts'

let directory: string | undefined
afterEach(() => {
  vi.restoreAllMocks()
  if (directory) rmSync(directory, { recursive: true, force: true })
})

it('replaces a refreshed applicant without duplicating it or losing other applicants', async () => {
  directory = mkdtempSync(join(tmpdir(), 'aislop-store-test-'))
  vi.spyOn(process, 'cwd').mockReturnValue(directory)
  vi.resetModules()
  const { saveApplicant, readApplicants } = await import('./store.ts')
  const first: Applicant = {
    id: 'first',
    alias: 'Applicant 001',
    declaredFields: ['embedded'],
    links: [],
    hasCv: false,
    sources: [],
    signals: computeSignals([]),
    createdAt: '2026-11-14T00:00:00Z',
  }
  const second = { ...first, id: 'second' }
  saveApplicant(first)
  saveApplicant(second)
  const updated = { ...first, declaredFields: ['ai'] as Applicant['declaredFields'] }
  saveApplicant(updated)
  expect(readApplicants()).toEqual([updated, second])
})
