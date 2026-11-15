// A CV is the applicant's own account, so everything read from it is a claim: it fills in
// education and work history that portfolio links rarely show, and names tools the person
// says they know. Parsed with plain rules from the text Context.dev extracts from the file.
import { toolsInText } from './taxonomy.ts'
import type { EducationEntry, ExperienceEntry, SourceData, WorkItem } from './types.ts'

const DEGREE =
  /\b(ph\.?\s?d|doctor(?:ate|al)?|d\.?sc|dr\.\s?(?:tech|sc)|licentiate|master(?:'s)?|m\.?sc|m\.?eng|mba|diplomi-insinööri|maisteri|tohtori|bachelor(?:'s)?|b\.?sc|b\.?eng|insinööri|kandidaatti|vocational|ammattitutkinto|ammattikoulu|associate degree)\b/i
const INSTITUTION =
  /\b(university|universität|université|institute|college|polytechnic|school of|yliopisto|ammattikorkeakoulu|korkeakoulu|academy)\b/i
const YEAR = '(?:19|20)\\d{2}'
const MONTH = '(?:0?[1-9]|1[0-2])'
const MONTH_NAME =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?'
const DATE = `(?:(?:${MONTH}[/.]|${MONTH_NAME}\\s+)${YEAR}|${YEAR}(?:-${MONTH})?)`
const CURRENT = 'present|now|current|ongoing|nykyinen|nykyhetki|jatkuu|today'
// Both ends are required. In particular, never read "2020 - unknown" as an ongoing role
// or match only the year inside a malformed month/year date.
const YEAR_RANGE = new RegExp(
  `(?<![\\p{L}\\p{N}/.-])(${DATE})\\s*(?:[-–—]|to|until)\\s*(${DATE}|${CURRENT})(?![\\p{L}\\p{N}/.-])`,
  'iu',
)

type Section = '' | 'education' | 'experience' | 'projects' | 'other'
function sectionOf(text: string): Section {
  const name = text.replace(/:$/, '').trim().toLowerCase()
  if (/^(education|education and qualifications|academic background|koulutus|opinnot|tutkinnot)$/.test(name))
    return 'education'
  if (
    /^(?:(?:work|professional|employment) )?experience$|^(employment(?: history)?|work history|työkokemus|työhistoria)$/.test(
      name,
    )
  )
    return 'experience'
  if (
    /^(?:(?:selected|personal|research) )?(projects?|publications?|patents?)(?: and (?:projects|publications|patents))?$|^(projektit|projekti|julkaisut|julkaisu|patentit)$/.test(
      name,
    )
  )
    return 'projects'
  if (
    /^(skills|technical skills|languages|interests|references|certifications|awards|summary|profile|contact|osaaminen|taidot|kielitaito|harrastukset|suosittelijat|yhteystiedot)$/.test(
      name,
    )
  )
    return 'other'
  return ''
}

const clean = (line: string) =>
  line
    .replace(/<!--.*?-->/g, '')
    .replace(/^\s*(?:[-+•]\s+|\d+[.)]\s+)/, '')
    .replace(/[*_`#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/** The field of study in a degree line: "M.Sc. in Electrical Engineering" gives the part after "in". */
function fieldOfStudy(line: string): string | null {
  const m = line.match(/\b(?:in|of)\s+([A-Za-zÅÄÖåäö&,\- ]{3,60}?)(?=$|[,;(|]|\s+(?:at|from)\b|\s+\d{4})/)
  if (m?.[1]) return m[1].trim()
  // Finnish CVs commonly put the field after the degree and a comma.
  const field = line.split(',')[1]?.trim()
  return field && !INSTITUTION.test(field) && !/\d/.test(field) ? field : null
}

function dateRange(line: string) {
  const match = line.match(YEAR_RANGE)
  if (!match) return null
  const startYear = Number(match[1]!.match(/(?:19|20)\d{2}/)![0])
  const end = match[2]!.match(/(?:19|20)\d{2}/)
  const endYear = end ? Number(end[0]) : null
  return endYear !== null && endYear < startYear ? null : { text: match[0], startYear, endYear }
}

export function parseCv(markdown: string): SourceData {
  let section: Section = ''
  let block = 0
  const rows = markdown
    .split('\n')
    .filter((raw) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(raw))
    .map((raw) => {
      const text = clean(raw)
      const named = sectionOf(text)
      // A bold job title is content, not a new section. Unrecognised top-level Markdown
      // headings still end the previous section so descriptions cannot leak into it.
      const heading = !!named || (/^#{1,2}\s/.test(raw.trim()) && !DEGREE.test(text) && !dateRange(text))
      if (heading) {
        section = named || 'other'
        block++
      }
      return { text, heading, section, block }
    })
    .filter((row) => row.text)
  const education: EducationEntry[] = []
  const experience: ExperienceEntry[] = []
  const workItems: WorkItem[] = []

  let role: WorkItem | null = null
  for (const [i, row] of rows.entries()) {
    const { text: line, section } = row
    if (row.heading) {
      role = null
      continue
    }
    const adjacent = [rows[i - 1], rows[i + 1]].filter(
      (r) => r && !r.heading && r.block === row.block && !DEGREE.test(r.text),
    )
    const range = dateRange(line)
    if (DEGREE.test(line) && section !== 'experience' && section !== 'projects') {
      // The institution is usually on the same line or the one next to it.
      const nearby = adjacent.map((r) => r!.text)
      const near = [line, ...nearby].find((l) => INSTITUTION.test(l))
      const dates = /\b(?:19|20)\d{2}\b/.test(line)
        ? line
        : (nearby.find((l) => INSTITUTION.test(l) || /^\s*\d/.test(l)) ?? '')
      const years = [...dates.matchAll(/\b((?:19|20)\d\d)\b/g)].map((m) => Number(m[1]))
      education.push({
        degree: line,
        field: fieldOfStudy(line),
        institution: near ?? null,
        endYear: years.length ? Math.max(...years) : null,
      })
      role = null
    } else if (section === 'projects') {
      workItems.push({
        title: line,
        tools: toolsInText(line).map((t) => t.name),
        year: range?.endYear ?? (Number(line.match(/\b(20\d\d)\b/)?.[1]) || null),
        sinceYear: range?.startYear ?? null,
      })
    } else if (range && (section === 'experience' || (!section && !INSTITUTION.test(line)))) {
      const previous = rows[i - 1]
      const label =
        line.replace(range.text, '').replace(/^[\s,;:|()-]+|[\s,;:|()-]+$/g, '') ||
        (previous && !previous.heading && previous.block === row.block && !dateRange(previous.text)
          ? previous.text
          : '')
      const [title, ...company] = label.split(/\s+at\s+|\s+@\s+|,\s*/)
      experience.push({
        title: title || null,
        organization: company.join(', ') || null,
        startYear: range.startYear,
        endYear: range.endYear,
      })
      role = label
        ? {
            title: label,
            tools: toolsInText(label).map((t) => t.name),
            sinceYear: range.startYear,
            year: range.endYear,
          }
        : null
      if (role) workItems.push(role)
    } else if (role && section === 'experience') {
      // A separate title immediately before the next date line belongs to that next role.
      const next = rows[i + 1]
      if (next && next.block === row.block && dateRange(next.text)?.text === next.text) continue
      role.description = [role.description, line].filter(Boolean).join('\n')
      role.tools = toolsInText(`${role.title}\n${role.description}`).map((t) => t.name)
    }
  }

  return {
    headline:
      rows.find(
        (r) => !r.heading && r.text.length > 3 && r.text.length < 90 && !/@|\d{5}|curriculum|resume|^cv$/i.test(r.text),
      )?.text ?? null,
    workItems,
    tools: toolsInText(markdown).map((t) => t.name),
    education,
    experience,
    counts: {},
    commitMessages: [],
  }
}
