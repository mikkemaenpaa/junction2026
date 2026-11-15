// Reads the event page for the participating companies, then each company's own website
// through Context.dev, and records which expertise areas each company recruits for. The
// places are later split between the areas by these shares. Writes data/companies.json.
//
//   node scripts/companies.ts [event page URL]
import { scrape } from '../src/lib/contextdev.ts'
import { writeData } from '../src/lib/store.ts'
import { FIELDS } from '../src/lib/taxonomy.ts'
import { FIELD_IDS } from '../src/lib/types.ts'
import type { Company, FieldId } from '../src/lib/types.ts'

const EVENT_PAGE = process.argv[2] ?? 'https://www.espoo.fi/en/DeepTechTalentForum'

const SCHEMA = {
  type: 'object',
  properties: {
    company_name: { type: ['string', 'null'] },
    summary: { type: ['string', 'null'] },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: { field: { type: 'string', enum: [...FIELD_IDS] }, weight: { type: 'number' } },
        required: ['field', 'weight'],
      },
    },
    sought_skills: { type: 'array', items: { type: 'string' } },
  },
  required: ['fields', 'sought_skills'],
}

const INSTRUCTIONS = [
  'This is the website of a company taking part in a deep tech recruitment event.',
  'summary: one sentence on what the company makes or does.',
  'fields: the expertise areas the company works in and would recruit for, at most three, with weights',
  'that add up to 1 (the main area highest). Use only these area ids:',
  ...FIELDS.map((f) => `${f.id} = ${f.name}: ${f.description}`),
  'sought_skills: up to twelve concrete technologies, tools or skills the company uses or hires for,',
  'as named on the page. Use only what the page states.',
].join(' ')

/** The companies listed under "Participating companies" on the event page. */
function listed(markdown: string): { name: string; url: string }[] {
  const at = markdown.search(/^#+\s*Participating companies/im)
  if (at < 0) return []
  const section = markdown.slice(at).split(/^#+\s/m)[1] ?? ''
  return [...section.matchAll(/^- \[([^\]]+?)(?:\(external link[^)]*\))?\]\((https?:\/\/[^)\s]+)\)/gm)].map((m) => ({
    name: m[1]!.trim(),
    url: m[2]!,
  }))
}

const page = await scrape(EVENT_PAGE, { markdown: true })
const companies = page.ok && page.markdown ? listed(page.markdown) : []
if (!companies.length) {
  console.error(`No participating companies found on ${EVENT_PAGE}${page.error ? ` (${page.error})` : ''}`)
  process.exit(1)
}
console.log(`${companies.length} companies on ${EVENT_PAGE}`)

let credits = page.credits
const results: Company[] = await Promise.all(
  companies.map(async ({ name, url }): Promise<Company> => {
    const site = await scrape(url, { json: { schema: SCHEMA, instructions: INSTRUCTIONS } })
    credits += site.credits
    const fields: Partial<Record<FieldId, number>> = {}
    for (const entry of Array.isArray(site.json?.fields) ? site.json.fields : []) {
      if (FIELD_IDS.includes(entry?.field) && typeof entry.weight === 'number' && entry.weight > 0) {
        fields[entry.field as FieldId] = (fields[entry.field as FieldId] ?? 0) + entry.weight
      }
    }
    // Every company counts as one, however the page split its weights.
    const sum = Object.values(fields).reduce((s, w) => s + w, 0)
    for (const field of Object.keys(fields) as FieldId[]) fields[field] = fields[field]! / sum
    const ok = site.ok && sum > 0
    console.log(
      `${ok ? 'ok    ' : 'FAILED'} ${name.padEnd(36)} ${
        ok
          ? Object.entries(fields)
              .map(([f, w]) => `${f} ${w!.toFixed(2)}`)
              .join(', ')
          : (site.error ?? 'no fields found')
      }`,
    )
    return {
      name,
      url,
      status: ok ? 'ok' : 'failed',
      summary: typeof site.json?.summary === 'string' ? site.json.summary : null,
      fields: ok ? fields : {},
      soughtSkills: Array.isArray(site.json?.sought_skills)
        ? site.json.sought_skills.filter((s: unknown) => typeof s === 'string').slice(0, 12)
        : [],
    }
  }),
)

writeData('companies.json', results)
console.log(
  `\n${results.filter((c) => c.status === 'ok').length}/${results.length} companies classified, ${credits} credits used, written to data/companies.json`,
)
