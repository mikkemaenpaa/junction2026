// Turns everything collected about an applicant into the signals the scoring uses. This is
// where the detailed judgement lives that the organiser never has to think about: which work
// counts for which field, how deep the evidence for each tool is, how regular the activity
// is and what the commit messages look like.
import { FIELDS, FIELD_BY_ID, TOOL_BY_NAME, fieldsInText, toolFromName, toolsInText } from './taxonomy.ts'
import { FIELD_IDS } from './types.ts'
import type { FieldId, Signals, Source, ToolSignal, WorkItem } from './types.ts'

/** Rises quickly at first and levels off: `scale` items give about 0.63, three times that 0.95. */
export const saturate = (value: number, scale: number) => (value > 0 ? 1 - Math.exp(-value / scale) : 0)

// Work published on these platforms belongs to the field even when its title does not say so.
const PLATFORM_FIELDS: Record<string, FieldId[]> = {
  scholar: ['research'],
  semanticscholar: ['research'],
  orcid: ['research'],
  arxiv: ['research'],
  researchgate: ['research'],
  patents: ['research'],
  zenodo: ['research'],
  osf: ['research'],
  huggingface: ['ai'],
  kaggle: ['ai'],
  hackaday: ['embedded'],
  hackster: ['embedded'],
  oshwlab: ['embedded'],
  arduino: ['embedded'],
  tinytapeout: ['semiconductors'],
}

// How much a stated role or project counts next to work that can be seen (1). A public
// professional profile is still the person's own account, but colleagues can read it, so it
// counts for more than a CV.
const STATED_WEIGHT: Record<string, number> = { linkedin: 0.6 }
const DEFAULT_STATED_WEIGHT = 0.3

const RESEARCH_PLATFORMS = new Set(['scholar', 'semanticscholar', 'orcid', 'arxiv', 'researchgate', 'zenodo', 'osf'])

const itemText = (item: WorkItem) => `${item.title} ${item.description ?? ''}`

/** Known tools a work item uses: those it lists and those its title and description mention. */
function itemTools(item: WorkItem): Set<string> {
  const tools = new Set<string>()
  for (const name of item.tools) {
    const tool = toolFromName(name)
    if (tool) tools.add(tool.name)
  }
  for (const tool of toolsInText(itemText(item))) tools.add(tool.name)
  return tools
}

// A model's judgement counts from this relevance on; below it the item is not work in the field.
const MIN_RELEVANCE = 0.5
// From this relevance on the item counts in full. Work often belongs to two fields at once (a
// processor core is both chip design and embedded), and the model then rates each a little lower.
const FULL_RELEVANCE = 0.7

/**
 * Fields a work item is evidence for, each with how much (0 to 1). A model's judgement of the
 * item is used when there is one; otherwise the fields come from the tools and words in it,
 * which either name a field or do not.
 */
function itemFields(item: WorkItem, platform: string): Map<FieldId, number> {
  const fields = new Map<FieldId, number>()
  if (item.fieldRelevance) {
    for (const [field, relevance] of Object.entries(item.fieldRelevance) as [FieldId, number][]) {
      if (relevance < MIN_RELEVANCE) continue
      fields.set(field, Math.max(fields.get(field) ?? 0, Math.min(1, relevance / FULL_RELEVANCE)))
    }
    return fields
  }
  for (const field of PLATFORM_FIELDS[platform] ?? []) fields.set(field, 1)
  for (const tool of itemTools(item)) for (const field of TOOL_BY_NAME[tool]!.fields) fields.set(field, 1)
  for (const field of fieldsInText(`${itemText(item)} ${item.tools.join(' ')}`)) fields.set(field, 1)
  return fields
}

const LEVELS: [number, string, RegExp][] = [
  [4, 'Doctorate', /\b(ph\.?\s?d|doctor(?:ate|al)?|d\.?sc|dr\.\s?(?:tech|sc)|postdoc)/i],
  [3, "Master's degree", /\b(master|m\.?sc|m\.?eng|mba|diplomi-insinööri|licentiate|m\.?s\.?\b|mphil)/i],
  [2, "Bachelor's degree", /\b(bachelor|b\.?sc|b\.?eng|b\.?tech|insinööri|b\.?s\.?\b|undergraduate)/i],
  [1, 'Vocational qualification', /\b(vocational|ammatti|trade school|associate degree|apprentice)/i],
]

/** 4 doctorate, 3 master's, 2 bachelor's, 1 vocational, 0 unknown. */
export function educationLevel(degree: string): { level: number; label: string } {
  for (const [level, label, pattern] of LEVELS) if (pattern.test(degree)) return { level, label }
  return { level: 0, label: 'Education' }
}

// A commit message that says what changed scores 1, a vague one 0. Merges are ignored.
const MERGE = /^merge (pull request|branch|remote)/i
const VAGUE =
  /^(update[sd]?|fix(es|ed)?|wip|test(s|ing)?|changes?|commit|stuff|misc|minor|cleanup|initial commit|first commit|readme|\.+|asdf+|temp|done|save|sync)\b[\s.!]*$/i

export function commitQuality(messages: string[]): number | null {
  const own = messages.filter((m) => !MERGE.test(m))
  if (own.length < 5) return null
  let total = 0
  for (const message of own) {
    const words = message.trim().split(/\s+/).length
    if (VAGUE.test(message.trim()) || message.length < 8) continue
    total += words >= 3 && message.length <= 100 ? 1 : 0.5
  }
  return total / own.length
}

/** Calendar years covered by a set of year ranges, counting overlapping ranges once. */
function yearsCovered(ranges: [number, number][], now: number): number {
  const years = new Set<number>()
  for (const [start, rawEnd] of ranges) {
    const end = Math.min(Math.max(rawEnd, start), now)
    // A role that starts and ends in the same year still counts as that year.
    for (let y = start; y < end || y === start; y++) years.add(y)
  }
  return years.size
}

/** A work's address, not its title: different projects can legitimately have the same name. */
function workIdentity(item: WorkItem, source: Source): string | null {
  if (!item.url) return null
  try {
    const url = new URL(item.url, /^https?:\/\//.test(source.url) ? source.url : undefined)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hostname = url.hostname.replace(/^www\./, '')
    url.hash = ''
    // Copy the keys before deleting; iterating the live parameters skips adjacent matches.
    for (const key of Array.from(url.searchParams.keys()))
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key)
    url.searchParams.sort()
    let path = url.pathname.replace(/\/+$/, '')
    if (url.hostname === 'github.com') {
      path = path
        .split('/')
        .slice(0, 3)
        .join('/')
        .replace(/\.git$/i, '')
        .toLowerCase()
      url.search = ''
    }
    return `${url.host}${path}${url.search}`
  } catch {
    return null
  }
}

/** Assign each identified work to one source, preferring verified work at its original host. */
function distinctWork(sources: Source[]): WorkItem[][] {
  const owners = new Map<string, { source: number; item: number; priority: number }>()
  const keys = sources.map((source, si) =>
    source.data!.workItems.map((item, wi) => {
      const key = workIdentity(item, source)
      if (item.fork || !key) return key
      let native = false
      try {
        native = key.split('/')[0] === new URL(source.url).host.replace(/^www\./, '')
      } catch {
        /* A CV does not have a source URL. */
      }
      const priority = (source.basis === 'verified' ? 4 : 0) + (native ? 2 : 0) + (item.fieldRelevance ? 1 : 0)
      if (!owners.has(key) || priority > owners.get(key)!.priority) owners.set(key, { source: si, item: wi, priority })
      return key
    }),
  )
  return sources.map((source, si) =>
    source.data!.workItems.filter((item, wi) => {
      if (item.fork) return false
      const key = keys[si]![wi]
      const owner = key ? owners.get(key) : undefined
      return !owner || (owner.source === si && owner.item === wi)
    }),
  )
}

export function computeSignals(sources: Source[], now = new Date().getFullYear()): Signals {
  const ok = sources.filter((s) => s.status === 'ok' && s.data)
  const unique = distinctWork(ok)

  const toolEvidence = new Map<
    string,
    { verified: number; claimed: boolean; stated: number; years: number[]; share: number }
  >()
  const evidence = (tool: string) => {
    let e = toolEvidence.get(tool)
    if (!e) toolEvidence.set(tool, (e = { verified: 0, claimed: false, stated: 0, years: [], share: 0 }))
    return e
  }

  const fieldItems = Object.fromEntries(FIELD_IDS.map((f) => [f, { verified: 0, claimed: 0 }])) as Record<
    FieldId,
    { verified: number; claimed: number }
  >
  // Stated roles and projects per field, each counted by its source's weight.
  const statedUnits = Object.fromEntries(FIELD_IDS.map((f) => [f, 0])) as Record<FieldId, number>
  let listedVerified = 0
  let totalVerified = 0
  let claimedItems = 0
  let popularity = 0
  let followers = 0
  const itemYears: number[] = []
  const messages: string[] = []
  const research = { publications: 0, citations: 0, hIndex: 0, patents: 0 }
  let contributions = 0
  let activeDays = 0
  let activeSince: number | null = null
  const ranges: [number, number][] = []
  let education: Signals['education'] = null
  const profileText: string[] = []

  for (const [index, source] of ok.entries()) {
    const data = source.data!
    const listedOwn = data.workItems.filter((item) => !item.fork)
    const own = unique[index]!
    profileText.push(data.headline ?? '')

    // Share of this source's own work that uses each tool. For a code profile that is the
    // share of repositories written in the language.
    const uses = new Map<string, number>()
    const statedWeight = STATED_WEIGHT[source.platform] ?? DEFAULT_STATED_WEIGHT
    for (const item of own) {
      const tools = itemTools(item)
      for (const [field, weight] of itemFields(item, source.platform)) {
        fieldItems[field][source.basis] += weight
        if (source.basis === 'claimed') statedUnits[field] += statedWeight * weight
      }
      for (const tool of tools) {
        uses.set(tool, (uses.get(tool) ?? 0) + 1)
        const e = evidence(tool)
        if (source.basis === 'verified') e.verified++
        else {
          e.claimed = true
          e.stated = Math.max(e.stated, statedWeight)
        }
        if (item.year) e.years.push(item.year)
        if (item.sinceYear) e.years.push(item.sinceYear)
      }
      if (item.year) itemYears.push(item.year)
      popularity += item.popularity ?? 0
    }
    if (source.basis === 'verified') {
      for (const [tool, count] of uses) evidence(tool).share = Math.max(evidence(tool).share, count / own.length)
    }

    // Tools a page names without tying them to a piece of work are statements, wherever they appear.
    for (const name of data.tools) {
      const tool = toolFromName(name)
      if (tool) evidence(tool.name).claimed = true
    }

    const counted = Math.max(data.counts.workItems ?? 0, data.counts.publications ?? 0, data.counts.patents ?? 0)
    if (source.basis === 'verified') {
      listedVerified += own.length
      // A profile may show ten publications of several hundred; the total on the page counts.
      // That total includes forked work: assume the part not listed has the same share of it.
      const ownShare = data.workItems.length ? listedOwn.length / data.workItems.length : 1
      const duplicates = listedOwn.length - own.length
      totalVerified += Math.max(own.length, Math.round(counted * ownShare) - duplicates)
    } else {
      claimedItems += own.length
    }

    const c = data.counts
    const isResearch = RESEARCH_PLATFORMS.has(source.platform)
    research.publications = Math.max(
      research.publications,
      c.publications ?? (isResearch ? Math.max(own.length, c.workItems ?? 0) : 0),
    )
    research.citations = Math.max(research.citations, c.citations ?? 0)
    research.hIndex = Math.max(research.hIndex, c.hIndex ?? 0)
    research.patents = Math.max(
      research.patents,
      c.patents ?? (source.platform === 'patents' ? Math.max(own.length, c.workItems ?? 0) : 0),
    )
    contributions = Math.max(contributions, c.contributionsLastYear ?? 0)
    followers = Math.max(followers, c.followers ?? 0)
    activeDays = Math.max(activeDays, c.activeDaysLastYear ?? 0)
    if (c.activeSinceYear && c.activeSinceYear > 1960 && c.activeSinceYear <= now)
      activeSince = Math.min(activeSince ?? now, c.activeSinceYear)
    messages.push(...data.commitMessages)

    for (const entry of data.experience) {
      if (entry.startYear && entry.startYear > 1960 && entry.startYear <= now)
        ranges.push([entry.startYear, entry.endYear ?? now])
      profileText.push(`${entry.title ?? ''} ${entry.organization ?? ''}`)
    }
    for (const entry of data.education) {
      const text = `${entry.degree ?? ''} ${entry.field ?? ''}`
      const { level, label } = educationLevel(text)
      const candidate = { level, label, field: entry.field ?? entry.degree ?? null, basis: source.basis }
      // The highest degree counts; between equal degrees a verified source wins.
      if (
        !education ||
        level > education.level ||
        (level === education.level && source.basis === 'verified' && education.basis === 'claimed')
      ) {
        education = candidate
      }
    }
  }

  if (itemYears.length) activeSince = Math.min(activeSince ?? now, ...itemYears.filter((y) => y > 1960 && y <= now))

  const tools: ToolSignal[] = [...toolEvidence.entries()].map(([tool, e]) => {
    const years = e.years.length ? Math.max(...e.years) - Math.min(...e.years) + 1 : 0
    const base = 0.45 * saturate(e.verified, 3) + 0.2 * saturate(years, 4) + 0.35 * e.share
    // A stated skill that the whole portfolio confirms counts in full. Work without a
    // statement is scored by how much of it there is. A statement without visible work stays
    // low: a little more when it names the roles the tool was used in and for how long.
    const stated = Math.max(0.15, e.stated * (0.5 + 0.3 * saturate(years, 4)))
    const strength = e.verified === 0 ? stated : e.claimed && e.share >= 0.8 ? 1 : Math.max(0.25, base)
    return {
      tool,
      fields: TOOL_BY_NAME[tool]!.fields,
      verifiedItems: e.verified,
      claimed: e.claimed,
      statedWeight: e.stated,
      share: e.share,
      years,
      strength,
    }
  })
  tools.sort((a, b) => b.strength - a.strength || b.verifiedItems - a.verifiedItems)

  // Roles and degrees also say which field a person works in, though more weakly than work.
  const statedFields = new Set(fieldsInText(profileText.join(' ')))
  const degreeField = (education?.field ?? '').toLowerCase()
  const items = listedVerified + claimedItems
  const relevance = Object.fromEntries(
    FIELDS.map((field) => {
      const { verified, claimed } = fieldItems[field.id]
      const degree = degreeField && field.degreeFields.some((d) => degreeField.includes(d)) ? 1 : 0
      const stated = statedFields.has(field.id) ? 1 : 0
      const units = verified + statedUnits[field.id] + 0.5 * degree + 0.5 * stated
      // The share of the visible work alone also counts, so that adding a profile or a CV
      // never lowers the relevance the portfolio already shows.
      const seen = listedVerified ? verified / listedVerified : 0
      const fraction = items ? Math.min(1, Math.max(seen, (verified + claimed) / items)) : degree || stated ? 0.6 : 0
      // Enough relevant work makes someone a match even when they also do other things;
      // the share only tempers it.
      return [field.id, saturate(units, 2.5) * (0.5 + 0.5 * fraction)]
    }),
  ) as Record<FieldId, number>

  const claimedYears = yearsCovered(ranges, now)
  const experience: Signals['experience'] = claimedYears
    ? { years: claimedYears, basis: 'claimed' }
    : activeSince
      ? { years: now - activeSince + 1, basis: 'activity' }
      : { years: 0, basis: null }

  return {
    tools,
    relevance,
    fieldItems,
    portfolio: {
      items: totalVerified + claimedItems,
      verifiedItems: totalVerified,
      listedVerified,
      claimedItems,
      popularity: Math.max(popularity, research.citations),
      followers,
      platforms: ok.filter((s) => s.basis === 'verified').length,
    },
    activity: {
      contributionsLastYear: contributions,
      activeDaysLastYear: activeDays,
      commitMessages: messages.filter((m) => !MERGE.test(m)).length,
      commitQuality: commitQuality(messages),
      lastActiveYear: itemYears.length ? Math.max(...itemYears) : contributions ? now : null,
      activeSinceYear: activeSince,
    },
    research,
    experience,
    education,
  }
}

/** Whether a degree belongs to the field, e.g. physics for quantum technologies. */
export function degreeFits(signals: Signals, field: FieldId): boolean {
  const text = (signals.education?.field ?? '').toLowerCase()
  return !!text && FIELD_BY_ID[field].degreeFields.some((d) => text.includes(d))
}
