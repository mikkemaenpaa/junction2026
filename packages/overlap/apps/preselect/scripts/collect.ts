// Collects every seed in data/seeds.json as an applicant, as if each had submitted the form
// with that one link, and writes them to data/applicants.json. Safe to stop and rerun: links
// that are already collected are skipped.
//
//   node scripts/collect.ts [max applicants]
import { collectApplicant } from '../src/lib/collect.ts'
import { readApplicants, readData, writeData } from '../src/lib/store.ts'
import { FIELD_IDS } from '../src/lib/types.ts'
import type { Applicant, FieldId } from '../src/lib/types.ts'
import type { Seed } from './discover.ts'

// Applicants collected side by side. Each needs one to six requests; the client itself
// limits how many run at once.
const PARALLEL = 6

// Links that are not a person's portfolio (an organisation's page, an empty page) are
// remembered and never fetched again. Anything else that failed is retried on the next run.
const UNUSABLE = ['ORGANISATION_NOT_A_PERSON', 'NO_PROFILE_CONTENT', 'NOT_A_PROFILE', 'NOT_FOUND']

const limit = Number(process.argv[2]) || Infinity
const seeds = readData<Seed[]>('seeds.json', [])
const applicants: Applicant[] = readApplicants().filter((a) => a.sources.some((s) => s.status === 'ok'))
const unusable = new Set(readData<string[]>('unusable.json', []))
const done = new Set(applicants.flatMap((a) => a.links.map((l) => l.toLowerCase())))
const queue = seeds
  .filter((seed) => {
    const link = new URL(seed.link).href.toLowerCase()
    return !done.has(link) && !unusable.has(link)
  })
  .slice(0, limit)

console.log(
  `${seeds.length} seeds, ${applicants.length} collected, ${unusable.size} unusable, ${queue.length} to collect`,
)

let credits = 0
let failed = 0
let turn = 0

async function worker() {
  for (let seed = queue.shift(); seed; seed = queue.shift()) {
    // Someone from outside deep tech still has to pick a field on the form: give them one
    // in turn, so every field gets a few.
    const field: FieldId = seed.field === 'off' ? FIELD_IDS[turn++ % FIELD_IDS.length]! : seed.field
    const applicant = await collectApplicant({ links: [seed.link], declaredFields: [field] })
    const source = applicant.sources[0]!
    credits += source.credits
    if (source.status === 'ok') {
      // Numbered in the order they finish, so the numbers stay unique across parallel workers.
      applicant.alias = `Applicant ${String(applicants.length + 1).padStart(3, '0')}`
      applicants.push(applicant)
      writeData('applicants.json', applicants)
    } else {
      failed++
      if (UNUSABLE.includes(source.error ?? '')) {
        unusable.add(new URL(seed.link).href.toLowerCase())
        writeData('unusable.json', [...unusable])
      }
    }
    console.log(
      `${applicant.alias} ${seed.field.padEnd(15)} ${source.status === 'ok' ? 'ok    ' : 'FAILED'} ${String(source.credits).padStart(2)}cr ` +
        `${source.status === 'ok' ? `${source.data!.workItems.length} items` : source.error} ${seed.link}`,
    )
  }
}

await Promise.all(Array.from({ length: PARALLEL }, worker))
writeData('applicants.json', applicants)
console.log(
  `\nDone: ${applicants.length} applicants in data/applicants.json, ${failed} of this run failed, ${credits} credits used`,
)
