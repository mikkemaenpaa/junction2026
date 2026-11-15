// The few lines an applicant card shows: the strongest facts behind the score, each marked
// by whether the work is visible in a portfolio or only stated by the applicant.
import { degreeFits } from './signals.ts'
import { toolsOfField } from './taxonomy.ts'
import type { Basis, CompanyFit, FieldId, Settings, Signals, SliderId } from './types.ts'

export interface Trait {
  text: string
  basis: Basis
  /** The slider this fact belongs to. */
  part: SliderId
}

const number = (n: number) =>
  n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
const plural = (n: number, one: string, many = `${one}s`) => `${number(n)} ${n === 1 ? one : many}`

export function traits(
  s: Signals,
  field: FieldId,
  settings: Settings,
  parts: Record<SliderId, number>,
  companies?: CompanyFit,
): Trait[] {
  const fieldTools = new Set(toolsOfField(field).map((t) => t.name))
  const tools = s.tools.filter((t) => fieldTools.has(t.tool))
  const found: Trait[] = []

  // Depth: the focus tool if the organiser picked one, otherwise the strongest tools.
  const depthTools = settings.focusTool ? s.tools.filter((t) => t.tool === settings.focusTool) : tools.slice(0, 2)
  for (const t of depthTools) {
    if (t.verifiedItems > 0) {
      const share = t.share >= 0.5 ? `${Math.round(t.share * 100)}% of public work, ` : ''
      const years = t.years >= 2 ? ` over ${t.years} years` : ''
      found.push({
        text: `${t.tool}: ${share}${plural(t.verifiedItems, 'project')}${years}`,
        basis: 'verified',
        part: 'toolDepth',
      })
    } else {
      const where =
        t.statedWeight >= 0.5 ? `named in work history${t.years >= 2 ? ` over ${t.years} years` : ''}` : 'stated'
      found.push({ text: `${t.tool}: ${where}, no public work found`, basis: 'claimed', part: 'toolDepth' })
    }
  }

  const verifiedTools = tools.filter((t) => t.verifiedItems > 0)
  if (verifiedTools.length >= 3) {
    found.push({
      text: `${verifiedTools.length} skills of the field in use: ${verifiedTools
        .slice(0, 5)
        .map((t) => t.tool)
        .join(', ')}`,
      basis: 'verified',
      part: 'toolBreadth',
    })
  }

  // Portfolio: research output for a research profile, otherwise the amount of public work.
  if (s.research.publications > 0 || s.research.patents > 0) {
    const bits = [
      s.research.publications ? plural(s.research.publications, 'publication') : '',
      s.research.patents ? plural(s.research.patents, 'patent') : '',
      s.research.hIndex ? `h-index ${s.research.hIndex}` : '',
      s.research.citations ? plural(s.research.citations, 'citation') : '',
    ].filter(Boolean)
    found.push({ text: bits.join(', '), basis: 'verified', part: 'portfolio' })
  } else if (s.portfolio.verifiedItems > 0) {
    const relevant = Math.round(s.fieldItems[field].verified)
    const stars = s.portfolio.popularity >= 20 ? `, ${number(s.portfolio.popularity)} stars or likes` : ''
    const audience = s.portfolio.followers >= 50 ? `, ${number(s.portfolio.followers)} followers` : ''
    found.push({
      text: `${plural(s.portfolio.verifiedItems, 'public work item')}${relevant ? `, ${relevant} in this field` : ''}${stars}${audience}`,
      basis: 'verified',
      part: 'portfolio',
    })
  }
  if (s.activity.contributionsLastYear >= 50) {
    const days = s.activity.activeDaysLastYear ? ` on ${s.activity.activeDaysLastYear} days` : ''
    found.push({
      text: `${number(s.activity.contributionsLastYear)} contributions in the last year${days}`,
      basis: 'verified',
      part: 'portfolio',
    })
  }
  if ((s.activity.commitQuality ?? 0) >= 0.7) {
    found.push({
      text: `Descriptive commit messages (${s.activity.commitMessages} read)`,
      basis: 'verified',
      part: 'portfolio',
    })
  }

  if (s.experience.years > 0) {
    found.push(
      s.experience.basis === 'activity'
        ? {
            text: `Public work since ${s.activity.activeSinceYear} (${plural(s.experience.years, 'year')})`,
            basis: 'verified',
            part: 'experience',
          }
        : { text: `${plural(s.experience.years, 'year')} of work experience`, basis: 'claimed', part: 'experience' },
    )
  }

  if (s.education && s.education.level > 0) {
    const fit = degreeFits(s, field) ? '' : ' (other field)'
    found.push({
      text: `${s.education.label}${s.education.field ? `: ${s.education.field}` : ''}${fit}`,
      basis: s.education.basis,
      part: 'education',
    })
  }

  if (companies?.matchCount) {
    const best = companies.matches.slice(0, 3)
    const shared = [...new Set(best.flatMap((m) => m.shared))].slice(0, 3)
    found.push({
      text: `Fits ${plural(companies.matchCount, 'company', 'companies')}: ${best.map((m) => m.name).join(', ')}${
        shared.length ? ` (shares ${shared.join(', ')})` : ''
      }`,
      basis: s.portfolio.verifiedItems > 0 ? 'verified' : 'claimed',
      part: 'companyFit',
    })
  }

  // Lead with what moved the score most under the current sliders.
  const weight = (t: Trait) => settings.weights[t.part] * parts[t.part]
  return found
    .map((t, i) => ({ t, i }))
    .sort((a, b) => weight(b.t) - weight(a.t) || a.i - b.i)
    .map(({ t }) => t)
    .slice(0, 5)
}
