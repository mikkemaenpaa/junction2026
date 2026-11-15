// What the organiser's page receives about each applicant: the signals and where they came
// from, without the raw page contents. Server-side only.
import { companyFit, workText } from './companies.ts'
import type { PreparedCompany } from './companies.ts'
import { platformOf } from './extract.ts'
import { priorityOf } from './priority.ts'
import { computeSignals } from './signals.ts'
import type { Applicant, Basis, CompanyFit, FieldId, Priority, Signals } from './types.ts'

export interface SourceView {
  url: string | null
  label: string
  basis: Basis
  ok: boolean
  error?: string
}

export interface ApplicantView {
  id: string
  alias: string
  declaredFields: FieldId[]
  sources: SourceView[]
  signals: Signals
  /** The slider part of `companies`, where scoring looks for it. */
  companyFit: number
  companies: CompanyFit
  /** Set when the applicant's reach puts them on the priority list. */
  priority: Priority | null
}

export function toView(applicant: Applicant, companies: PreparedCompany[]): ApplicantView {
  // Derived again on every read, so a change to the taxonomy or the rules applies to
  // applicants collected earlier.
  const signals = computeSignals(applicant.sources)
  const fit = companyFit(signals, workText(applicant), companies)
  return {
    id: applicant.id,
    alias: applicant.alias,
    declaredFields: applicant.declaredFields,
    signals,
    companyFit: fit.part,
    companies: fit,
    priority: priorityOf(applicant.sources),
    sources: applicant.sources.map((source) => ({
      url: source.platform === 'cv' ? null : source.url,
      label: source.platform === 'cv' ? 'CV' : platformOf(source.url).label,
      basis: source.basis,
      ok: source.status === 'ok',
      error: source.error,
    })),
  }
}
