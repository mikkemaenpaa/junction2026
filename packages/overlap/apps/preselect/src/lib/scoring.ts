// Scores applicants for a field from their signals and the organiser's sliders, and picks
// the suggested group with a quota per field. Pure functions with no I/O, so the browser can
// rerun them on every slider move.
import { degreeFits, saturate } from './signals.ts'
import { toolsOfField } from './taxonomy.ts'
import { FIELD_IDS, SLIDER_IDS } from './types.ts'
import type { Priority, Applicant, Company, FieldId, Settings, Signals, SliderId } from './types.ts'

/**
 * What scoring needs from an applicant: the fields they picked, their signals and how well
 * they fit the participating companies (0 to 1; missing when no companies are known).
 */
export type Scorable = Pick<Applicant, 'declaredFields' | 'signals'> & {
  companyFit?: number
  priority?: Priority | null
}

export const DEFAULT_SETTINGS: Settings = {
  weights: { experience: 50, portfolio: 70, toolBreadth: 50, toolDepth: 70, education: 30, companyFit: 70 },
  focusTool: null,
  count: 20,
}

const EDUCATION_SCORE = [0, 0.25, 0.6, 0.85, 1]

// What work a profile only counts, without listing it, is worth next to work that was read.
const UNREAD_WEIGHT = 0.5

export interface FieldScore {
  field: FieldId
  /** 0 to 100. */
  score: number
  /** Each slider's part, 0 to 1, before the organiser's weights. */
  parts: Record<SliderId, number>
  relevance: number
}

/**
 * The hidden part of the scoring: how each slider's part is built from the signals. The match
 * with the companies is not here: it depends on the companies, not on the field.
 */
export function scoreParts(
  signals: Signals,
  field: FieldId,
  focusTool: string | null,
  now = new Date().getFullYear(),
): Omit<Record<SliderId, number>, 'companyFit'> {
  const fieldTools = new Set(toolsOfField(field).map((t) => t.name))
  const tools = signals.tools.filter((t) => fieldTools.has(t.tool))

  // Work history counts in full; years inferred from public activity alone count for less.
  const experience = saturate(signals.experience.years, 6) * (signals.experience.basis === 'activity' ? 0.75 : 1)

  // Portfolio: mostly how much verified work concerns this field, then how active, how
  // widely used or cited, how carefully committed and how recent it is.
  const { verified } = signals.fieldItems[field]
  const { verifiedItems, listedVerified } = signals.portfolio
  // When a profile states a larger total than the items read, assume the same share of the rest
  // is relevant, but count it for half: nobody has looked at that work.
  const unread = Math.max(0, verifiedItems - listedVerified)
  const relevantWork = listedVerified ? verified * (1 + (UNREAD_WEIGHT * unread) / listedVerified) : 0
  const activity = Math.max(
    saturate(signals.activity.contributionsLastYear, 800),
    saturate(signals.activity.activeDaysLastYear, 120),
  )
  // Reach: how widely the work is used or cited, or how many people follow the person.
  const reach = saturate(Math.log10(1 + Math.max(signals.portfolio.popularity, signals.portfolio.followers)), 2.5)
  const care = signals.activity.commitQuality ?? 0.5
  const age = signals.activity.lastActiveYear ? now - signals.activity.lastActiveYear : 99
  const recency = age <= 1 ? 1 : age <= 3 ? 0.6 : age <= 6 ? 0.3 : 0
  const portfolio =
    relevantWork > 0
      ? 0.5 * saturate(relevantWork, 12) + 0.2 * activity + 0.15 * reach + 0.05 * care + 0.1 * recency
      : 0

  // Breadth: tools of the field with work behind them. A tool only stated counts a quarter,
  // or a little more when a profile names the role it was used in.
  const breadth = tools.reduce((sum, t) => sum + (t.verifiedItems > 0 ? 1 : Math.max(0.25, t.statedWeight)), 0)
  const toolBreadth = saturate(breadth, 4)

  const toolDepth = focusTool
    ? (signals.tools.find((t) => t.tool === focusTool)?.strength ?? 0)
    : tools.reduce((best, t) => Math.max(best, t.strength), 0)

  const level = signals.education?.level ?? 0
  const education =
    EDUCATION_SCORE[level]! *
    (degreeFits(signals, field) ? 1 : 0.5) *
    (signals.education?.basis === 'claimed' ? 0.9 : 1)

  return { experience, portfolio, toolBreadth, toolDepth, education }
}

export function scoreField(applicant: Scorable, field: FieldId, settings: Settings): FieldScore {
  const parts = { ...scoreParts(applicant.signals, field, settings.focusTool), companyFit: applicant.companyFit ?? 0 }
  const totalWeight = SLIDER_IDS.reduce((sum, id) => sum + settings.weights[id], 0)
  const weighted = totalWeight
    ? SLIDER_IDS.reduce((sum, id) => sum + settings.weights[id] * parts[id], 0) / totalWeight
    : 0
  // Relevance gates everything: long experience or a high degree in an unrelated area does
  // not make someone a match for this field.
  const relevance = applicant.signals.relevance[field]
  return { field, score: Math.round(1000 * relevance * weighted) / 10, parts, relevance }
}

/** The field an applicant competes in: the best of those they picked, or of all eight. */
export function bestField(applicant: Scorable, settings: Settings): FieldScore {
  const candidates = applicant.declaredFields.length ? applicant.declaredFields : FIELD_IDS
  return candidates
    .map((field) => scoreField(applicant, field, settings))
    .reduce((best, s) => (s.score > best.score ? s : best))
}

/** Each field's share of the places: its share of the participating companies' interest. */
export function fieldShares(companies: Company[]): Record<FieldId, number> {
  const totals = Object.fromEntries(FIELD_IDS.map((f) => [f, 0])) as Record<FieldId, number>
  for (const company of companies) {
    for (const [field, weight] of Object.entries(company.fields)) totals[field as FieldId] += weight ?? 0
  }
  const sum = FIELD_IDS.reduce((s, f) => s + totals[f], 0)
  // Without company data every field gets an equal share.
  for (const f of FIELD_IDS) totals[f] = sum ? totals[f] / sum : 1 / FIELD_IDS.length
  return totals
}

/** Split `count` places by share so the parts add up exactly (largest remainder). */
export function apportion(count: number, shares: Record<FieldId, number>): Record<FieldId, number> {
  const exact = FIELD_IDS.map((f) => ({ field: f, value: count * shares[f] }))
  const slots = Object.fromEntries(exact.map((e) => [e.field, Math.floor(e.value)])) as Record<FieldId, number>
  let left = count - FIELD_IDS.reduce((s, f) => s + slots[f], 0)
  for (const e of [...exact].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (left-- <= 0) break
    slots[e.field]++
  }
  return slots
}

// A field's own places go only to applicants who reach this score. Below it the place is
// passed on, so nobody is suggested just because their field had room.
export const QUOTA_FLOOR = 10

export interface Suggestion<T extends Scorable = Applicant> extends FieldScore {
  applicant: T
  /** True when the place came from a field that could not fill its own quota. */
  overflow: boolean
}

export interface Selection<T extends Scorable = Applicant> {
  suggestions: Suggestion<T>[]
  slots: Record<FieldId, number>
  /** Applicants competing in each field. */
  pool: Record<FieldId, number>
}

/**
 * Suggest up to `settings.count` applicants. Applicants on the priority list take a place
 * first, whatever their score, and lead the list. Each field then fills what is left of its
 * quota with its best applicants who reach the floor; places a field cannot fill go to the
 * best of everyone left.
 */
export function select<T extends Scorable>(
  applicants: T[],
  settings: Settings,
  shares: Record<FieldId, number>,
): Selection<T> {
  const first = (s: { applicant: T }) => (s.applicant.priority ? 1 : 0)
  const scored = applicants
    .map((applicant) => ({ applicant, ...bestField(applicant, settings) }))
    .filter((s) => s.score > 0 || first(s))
  scored.sort((a, b) => first(b) - first(a) || b.score - a.score)

  const slots = apportion(settings.count, shares)
  const pool = Object.fromEntries(FIELD_IDS.map((f) => [f, 0])) as Record<FieldId, number>
  const taken = Object.fromEntries(FIELD_IDS.map((f) => [f, 0])) as Record<FieldId, number>
  const suggestions: Suggestion<T>[] = []
  const rest: typeof scored = []

  for (const s of scored) {
    pool[s.field]++
    const place = first(s)
      ? suggestions.length < settings.count
      : taken[s.field] < slots[s.field] && s.score >= QUOTA_FLOOR
    if (place) {
      // A priority place comes out of the field's own quota while it has any left.
      taken[s.field]++
      suggestions.push({ ...s, overflow: false })
    } else {
      rest.push(s)
    }
  }
  for (const s of rest) {
    if (suggestions.length >= settings.count) break
    suggestions.push({ ...s, overflow: true })
  }

  suggestions.sort((a, b) => first(b) - first(a) || b.score - a.score)
  // Priority places beyond a field's quota push out the lowest scores.
  return { suggestions: suggestions.slice(0, settings.count), slots, pool }
}
