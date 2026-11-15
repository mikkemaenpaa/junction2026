// How well an applicant matches the companies taking part in the event. Per company: how much
// of the applicant's evidence lies in the company's fields, raised when the applicant has the
// specific skills the company's site asks for. Pure functions with no I/O.
import { saturate } from './signals.ts'
import { toolsInText } from './taxonomy.ts'
import { FIELD_IDS } from './types.ts'
import type { Applicant, Company, CompanyFit, CompanyMatch, FieldId, Signals } from './types.ts'

// Words too common in "skills we look for" lists to tell one company's needs from another's.
const GENERIC = new Set(
  `and for the with from into our your new high low based driven related level senior junior strong
  technology technologies technical process processes design development management system systems
  analysis research strategy strategic engineering engineer solutions solution services service
  software hardware data tools tool skills skill experience knowledge advanced product products
  project projects business international digital testing test modeling modelling control device
  devices material materials quality support operations planning team teams customer customers
  application applications platform platforms method methods work working building`.split(/\s+/),
)

// Names of whole fields: the fit by field already covers them.
const FIELD_WORDS = new Set(
  'photonics semiconductor semiconductors electronics microelectronics embedded quantum robotics aerospace'.split(' '),
)

/** A company with its needs in a form that is quick to compare against an applicant. */
export interface PreparedCompany {
  name: string
  fields: Partial<Record<FieldId, number>>
  /** Known skills named among the company's sought skills or in its summary. */
  skills: string[]
  /** Sought skills as their distinctive words, e.g. "black silicon fabrication processes" -> black, silicon, fabrication. */
  phrases: { text: string; words: RegExp[] }[]
}

export function prepareCompanies(companies: Company[]): PreparedCompany[] {
  return companies
    .filter((company) => company.status === 'ok')
    .map((company) => {
      const skills = toolsInText(`${company.soughtSkills.join('\n')}\n${company.summary ?? ''}`).map((t) => t.name)
      const known = new Set(skills.map((skill) => skill.toLowerCase()))
      const phrases = company.soughtSkills.flatMap((text) => {
        // A sought skill that is a known skill is already compared by name.
        if (known.has(text.toLowerCase())) return []
        const words = text
          .toLowerCase()
          .split(/[^a-z0-9+#]+/)
          .filter((word) => word.length >= 5 && !GENERIC.has(word))
          .slice(0, 3)
        // One word is enough only when it is long and not the name of a whole field:
        // "photodetector", not "photonics".
        if (!words.length || (words.length === 1 && (words[0]!.length < 8 || FIELD_WORDS.has(words[0]!)))) return []
        return [{ text, words: words.map((word) => new RegExp(`\\b${word.replace(/[+#]/g, '\\$&')}`)) }]
      })
      return { name: company.name, fields: company.fields, skills, phrases }
    })
}

/** Everything the applicant's sources say about their work, as one lower-case text. */
export function workText(applicant: Pick<Applicant, 'sources'>): string {
  return applicant.sources
    .filter((source) => source.status === 'ok' && source.data)
    .flatMap((source) => [
      source.data!.headline ?? '',
      ...source.data!.workItems.map((item) => `${item.title} ${item.description ?? ''} ${item.tools.join(' ')}`),
    ])
    .join('\n')
    .toLowerCase()
}

// A company is named on the card as a match from this fit on.
const MATCH = 0.4

export function companyFit(signals: Signals, text: string, companies: PreparedCompany[]): CompanyFit {
  const strength = new Map(signals.tools.map((t) => [t.tool, t.strength]))
  const fits: CompanyMatch[] = []

  for (const company of companies) {
    // Share of the company's hiring interest that falls in fields the applicant has evidence for.
    const align = FIELD_IDS.reduce((sum, field) => sum + (company.fields[field] ?? 0) * signals.relevance[field], 0)
    if (align <= 0) continue

    const sharedSkills = company.skills.filter((skill) => strength.has(skill))
    // Having about three of the company's skills well covers it.
    const skill = company.skills.length
      ? Math.min(1, sharedSkills.reduce((sum, s) => sum + strength.get(s)!, 0) / Math.min(company.skills.length, 3))
      : 0
    const sharedPhrases = company.phrases.filter((phrase) => phrase.words.every((word) => word.test(text)))
    const phrase = saturate(sharedPhrases.length, 1.5)
    const specific = 1 - (1 - skill) * (1 - phrase)

    // Being in the company's fields gives most of the fit; its specific needs give the rest.
    const fit = align * (0.6 + 0.4 * specific)
    fits.push({ name: company.name, fit, shared: [...sharedSkills, ...sharedPhrases.map((p) => p.text)].slice(0, 3) })
  }

  fits.sort((a, b) => b.fit - a.fit)
  // The three best matches decide, the best one most: fitting one company very well already
  // makes someone worth inviting, and fitting twenty loosely does not add up to more.
  const part = [0.5, 0.3, 0.2].reduce((sum, weight, i) => sum + weight * (fits[i]?.fit ?? 0), 0)
  const matches = fits.filter((m) => m.fit >= MATCH)
  return { part, matches: matches.slice(0, 5), matchCount: matches.length }
}
