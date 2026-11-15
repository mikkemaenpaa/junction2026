import {
  COMPANIES,
  EVENTS,
  TALENTS,
  type Answers,
  type CompanyProfile,
  type Culture,
  type EventItem,
  type MockCompany,
  type MockTalent,
  type Role,
  type TalentProfile,
} from './data'

export type Dim = 'Skills' | 'Field' | 'Languages' | 'Culture' | 'Logistics'
export const DIMS: Dim[] = ['Skills', 'Field', 'Languages', 'Culture', 'Logistics']
export type Breakdown = Record<Dim, number>
export type Fit = { score: number; dims: Breakdown }

const W: Breakdown = { Skills: 0.3, Field: 0.15, Languages: 0.15, Culture: 0.25, Logistics: 0.15 }
const ADJ: Record<string, string[]> = {
  Design: ['Product'],
  Product: ['Design', 'Data'],
  Data: ['Product', 'Engineering'],
  Engineering: ['Data'],
  Marketing: ['Product'],
}
const ratio = (a: string[], b: string[]) => (b.length ? a.filter((x) => b.includes(x)).length / b.length : 0.6)
const fieldScore = (a: string, b: string) => (!a ? 0.5 : a === b ? 1 : ADJ[a]?.includes(b) ? 0.5 : 0.15)
const jaccard = (a: string[], b: string[]) => {
  const u = new Set([...a, ...b]).size
  return u ? a.filter((x) => b.includes(x)).length / u : 0.5
}
const cultureScore = (a: Culture, b: Culture, va: string[], vb: string[]) => {
  const k: (keyof Culture)[] = ['remote', 'pace', 'structure', 'collab']
  const d = k.reduce((s, x) => s + Math.abs(a[x] - b[x]), 0) / k.length
  return 0.65 * (1 - d / 100) + 0.35 * Math.min(1, jaccard(va, vb) * 2.2)
}
const avail = (a: string) =>
  ({ Immediately: 1, 'Within 1 month': 0.85, 'Within 3 months': 0.6, 'Not looking': 0.15 })[a] ?? 0.7
const finish = (d: Breakdown): Fit => {
  const dims = Object.fromEntries(DIMS.map((k) => [k, Math.round(d[k] * 100)])) as Breakdown
  const score = Math.round(DIMS.reduce((s, k) => s + d[k] * W[k], 0) * 100)
  return { score, dims }
}

export const cultureOf = (a: Answers): Culture => ({
  remote: (a.remote as number) ?? 50,
  pace: (a.pace as number) ?? 50,
  structure: (a.structure as number) ?? 50,
  collab: (a.collab as number) ?? 50,
})

export function talentVsCompany(p: TalentProfile, a: Answers, c: MockCompany): Fit {
  const permitOk = p.permit === 'Needs sponsorship' ? (c.sponsors ? 0.8 : 0.1) : 1
  const yearsOk = p.years >= c.minYears ? 1 : Math.max(0.3, 1 - (c.minYears - p.years) * 0.25)
  return finish({
    Skills: ratio(p.skills, c.skills),
    Field: fieldScore(p.field, c.field),
    Languages: ratio(p.languages, c.languages),
    Culture: cultureScore(cultureOf(a), c.culture, (a.values as string[]) ?? [], c.values),
    Logistics: (avail(p.availability) + permitOk + yearsOk) / 3,
  })
}

export function companyVsTalent(p: CompanyProfile, a: Answers, t: MockTalent): Fit {
  const urgency = ((a.urgency as number) ?? 50) / 100
  const seniority = 1 + Math.round((((a.seniority as number) ?? 40) / 100) * 8)
  const yearsOk = Math.max(0.3, 1 - Math.abs(t.years - seniority) * 0.12)
  const sponsors = ((a.benefits as string[]) ?? []).includes('Visa sponsorship')
  const permitOk = t.permit === 'Needs sponsorship' ? (sponsors ? 0.8 : 0.1) : 1
  const av = avail(t.availability)
  return finish({
    Skills: ratio(t.skills, p.skills.length ? p.skills : []),
    Field: fieldScore(p.field, t.field),
    Languages: ratio(t.languages, p.languages),
    Culture: cultureScore(cultureOf(a), t.culture, (a.values as string[]) ?? [], t.values),
    Logistics: (yearsOk + permitOk + (urgency > 0.6 ? av : 0.5 + av / 2)) / 3,
  })
}

export type EventFit = {
  score: number
  strongest: { dim: Dim; value: number }
  gap: { dim: Dim; value: number }
  dims: Breakdown
}
export function aggregate(fits: Fit[]): EventFit {
  if (!fits.length)
    return {
      score: 0,
      dims: { Skills: 0, Field: 0, Languages: 0, Culture: 0, Logistics: 0 },
      strongest: { dim: 'Skills', value: 0 },
      gap: { dim: 'Skills', value: 0 },
    }
  const top = [...fits].sort((a, b) => b.score - a.score).slice(0, 3)
  const dims = Object.fromEntries(
    DIMS.map((k) => [k, Math.round(top.reduce((s, f) => s + f.dims[k], 0) / top.length)]),
  ) as Breakdown
  const sorted = [...DIMS].sort((a, b) => dims[b] - dims[a])
  return {
    score: Math.round(top.reduce((s, f) => s + f.score, 0) / top.length),
    dims,
    strongest: { dim: sorted[0], value: dims[sorted[0]] },
    gap: { dim: sorted[sorted.length - 1], value: dims[sorted[sorted.length - 1]] },
  }
}

export const fitLabel = (s: number) =>
  s >= 80 ? 'Excellent fit' : s >= 65 ? 'Strong fit' : s >= 50 ? 'Partial fit' : 'Low fit'

export type Ctx = { role: Role; talent: TalentProfile; company: CompanyProfile; answers: Answers; filters: boolean }

export function passCompany(x: Ctx, c: MockCompany) {
  if (!x.filters) return true
  const t = x.talent
  if (t.field && c.field !== t.field) return false
  if (t.languages.length && !c.languages.some((l) => t.languages.includes(l))) return false
  if (t.years && t.years < c.minYears - 1) return false
  if (t.availability === 'Not looking') return false
  if (t.permit === 'Needs sponsorship' && !c.sponsors) return false
  return true
}
export function passTalent(x: Ctx, t: MockTalent) {
  if (!x.filters) return true
  const p = x.company
  if (p.field && t.field !== p.field) return false
  if (p.languages.length && !p.languages.every((l) => t.languages.includes(l))) return false
  if (p.skills.length && !p.skills.some((s) => t.skills.includes(s))) return false
  return true
}

export const rankCompanies = (x: Ctx) =>
  COMPANIES.filter((c) => passCompany(x, c))
    .map((c) => ({ c, fit: talentVsCompany(x.talent, x.answers, c) }))
    .sort((a, b) => b.fit.score - a.fit.score)
export const rankTalents = (x: Ctx, pool: MockTalent[] = TALENTS) =>
  pool
    .filter((t) => passTalent(x, t))
    .map((t) => ({ t, fit: companyVsTalent(x.company, x.answers, t) }))
    .sort((a, b) => b.fit.score - a.fit.score)

export function eventFit(x: Ctx, e: EventItem) {
  if (x.role === 'talent')
    return aggregate(
      rankCompanies(x)
        .filter((r) => e.companyIds.includes(r.c.id))
        .map((r) => r.fit),
    )
  return aggregate(
    rankTalents(
      x,
      TALENTS.filter((t) => e.talentIds.includes(t.id)),
    ).map((r) => r.fit),
  )
}
export const eventVisible = (x: Ctx, e: EventItem) =>
  !x.filters ||
  (x.role === 'talent'
    ? e.companyIds.some((id) =>
        passCompany(
          x,
          COMPANIES.find((c) => c.id === id)!,
        ),
      )
    : e.talentIds.some((id) =>
        passTalent(
          x,
          TALENTS.find((t) => t.id === id)!,
        ),
      ))
export { EVENTS }
