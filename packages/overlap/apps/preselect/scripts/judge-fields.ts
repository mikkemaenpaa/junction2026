// Adds a model's judgement of the field of each piece of work to applicants collected before
// that existed (new applications get it as they are read). GitHub profiles get one extra read
// of the repository list; every other page is read again with the current extraction.
//
//   node scripts/judge-fields.ts --sample   a spread of 20 applicants into data/trial.json,
//                                           leaving data/applicants.json alone
//   node scripts/judge-fields.ts            every applicant not judged yet, saved to
//                                           data/applicants.json (the old file is kept as
//                                           data/applicants.before-fields.json)
// Both print how each applicant's field and score change.
import { extractPage } from '../src/lib/extract.ts'
import { classifyRepos, githubTarget, repoKey } from '../src/lib/github.ts'
import { DEFAULT_SETTINGS, bestField } from '../src/lib/scoring.ts'
import { computeSignals } from '../src/lib/signals.ts'
import { readApplicants, readData, writeData } from '../src/lib/store.ts'
import type { Applicant, Source } from '../src/lib/types.ts'

const SAMPLE = process.argv.includes('--sample')
const isJudged = (source: Source) => !!source.data?.workItems.some((item) => item.fieldRelevance)

const seeds = readData<{ field: string; link: string }[]>('seeds.json', [])
const seedField = new Map(seeds.map((seed) => [seed.link, seed.field]))
const stored = readApplicants()
const readable = stored.filter((a) => a.sources.some((s) => s.status === 'ok'))

// The sample: a spread over platforms and fields, with off-field portfolios in it as a check.
const byPlatform = (platform: string, off: boolean) =>
  readable.filter((a) => a.sources[0]!.platform === platform && (seedField.get(a.links[0]!) === 'off') === off)
const every = <T>(items: T[], count: number) =>
  items.length <= count
    ? items
    : Array.from({ length: count }, (_, i) => items[Math.floor((i * items.length) / count)]!)
const chosen: Applicant[] = SAMPLE
  ? [
      ...every(byPlatform('github', false), 7),
      ...every(byPlatform('semanticscholar', false), 3),
      ...every(byPlatform('medium', false), 2),
      ...every(
        ['hackster', 'hackaday', 'kaggle', 'tinytapeout'].flatMap((p) => byPlatform(p, false)),
        3,
      ),
      ...every(byPlatform('github', true), 2),
      ...every(
        ['behance', 'medium'].flatMap((p) => byPlatform(p, true)),
        3,
      ),
    ]
  : readable.filter((a) => a.sources.some((s) => s.status === 'ok' && !isJudged(s)))

let credits = 0
async function judge(source: Source): Promise<Source> {
  if (source.status !== 'ok' || !source.data || isJudged(source)) return source
  if (source.platform === 'github') {
    const login = githubTarget(source.url)?.login
    if (!login) return source
    const { fit, credits: used } = await classifyRepos(login)
    credits += used
    const workItems = source.data.workItems.map((item) => ({
      ...item,
      fieldRelevance: fit.get(repoKey(item.title)),
    }))
    return { ...source, data: { ...source.data, workItems } }
  }
  if (source.platform === 'cv' || source.platform === 'linkedin') return source
  const result = await extractPage(source.url)
  credits += result.credits
  return result.data ? { ...source, data: result.data } : source
}

const score = (applicant: Applicant, sources: Source[]) =>
  bestField({ declaredFields: applicant.declaredFields, signals: computeSignals(sources) }, DEFAULT_SETTINGS)
const rows: string[] = []
const done = new Map<string, Applicant>()
const queue = [...chosen]
await Promise.all(
  Array.from({ length: 5 }, async () => {
    for (let applicant = queue.shift(); applicant; applicant = queue.shift()) {
      const sources = await Promise.all(applicant.sources.map(judge))
      done.set(applicant.id, { ...applicant, sources, signals: computeSignals(sources) })
      const before = score(applicant, applicant.sources)
      const after = score(applicant, sources)
      const items = sources.flatMap((s) => s.data?.workItems ?? [])
      rows.push(
        `${applicant.alias} ${applicant.sources[0]!.platform.padEnd(15)} ${(seedField.get(applicant.links[0]!) ?? '?').padEnd(14)} ` +
          `${before.field.padEnd(14)} ${String(before.score).padStart(5)} -> ${after.field.padEnd(14)} ${String(after.score).padStart(5)} ` +
          `| judged ${items.filter((item) => item.fieldRelevance).length}/${items.length}`,
      )
    }
  }),
)

if (SAMPLE) {
  writeData('trial.json', [...done.values()])
} else if (done.size) {
  writeData('applicants.before-fields.json', stored)
  writeData(
    'applicants.json',
    stored.map((applicant) => done.get(applicant.id) ?? applicant),
  )
}
console.log('applicant     platform        seeded as      keywords: field, score -> model: field, score')
console.log(rows.sort().join('\n'))
console.log(
  `\n${chosen.length} applicants, ${credits} credits used. Saved to data/${SAMPLE ? 'trial.json' : 'applicants.json'}`,
)
