// File storage for the prototype: applicants and companies live as JSON under data/, which
// is not committed. Server-side only.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Applicant, Company } from './types.ts'

const DATA_DIR = resolve(process.cwd(), 'data')

export function readData<T>(name: string, fallback: T): T {
  const path = resolve(DATA_DIR, name)
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

export function writeData(name: string, value: unknown): void {
  mkdirSync(DATA_DIR, { recursive: true })
  const path = resolve(DATA_DIR, name)
  // Write next to the target and rename, so a reader never sees a half-written file.
  writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 1))
  renameSync(`${path}.tmp`, path)
}

export const readApplicants = () => readData<Applicant[]>('applicants.json', [])
export const readCompanies = () => readData<Company[]>('companies.json', [])

/** Insert a new applicant or replace the existing record when sources or choices are refreshed. */
export function saveApplicant(applicant: Applicant): void {
  const applicants = readApplicants()
  const index = applicants.findIndex((a) => a.id === applicant.id)
  if (index < 0) applicants.push(applicant)
  else applicants[index] = applicant
  writeData('applicants.json', applicants)
}
