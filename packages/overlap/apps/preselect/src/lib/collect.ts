// Collects everything about one applicant from the links they gave (and an optional CV)
// through Context.dev, and derives the signals used for scoring.
import { enrichPerson, parseFile, scrape } from './contextdev.ts'
import { parseCv } from './cv.ts'
import { extractPage, platformOf } from './extract.ts'
import { collectGithub, githubTarget } from './github.ts'
import { parseLinks } from './links.ts'
import { hasAudience, parseFollowers } from './priority.ts'
import { computeSignals } from './signals.ts'
import { toolsInText } from './taxonomy.ts'
import type { Applicant, FieldId, Source, SourceData } from './types.ts'

const year = (date: any): number | null => (typeof date?.year === 'number' ? date.year : null)

/** A Context.dev person record (found from a LinkedIn link) in the common shape. */
export function fromPerson(person: any, now = new Date().getFullYear()): SourceData {
  const roles: any[] = [...(Array.isArray(person.experience) ? person.experience : [])]
  if (person.current_role && !roles.some((r) => r?.is_current)) roles.unshift(person.current_role)
  const schools: any[] = Array.isArray(person.education) ? person.education : []
  const skills: string[] = Array.isArray(person.skills)
    ? person.skills.filter((s: unknown) => typeof s === 'string')
    : []
  // The bio and the study descriptions name skills without tying them to a role.
  const named = toolsInText([person.bio, ...schools.map((e) => e?.description)].filter(Boolean).join('\n')).map(
    (t) => t.name,
  )
  return {
    personName: person.name?.full ?? null,
    headline: person.bio ?? person.current_role?.title ?? null,
    organization: person.current_role?.organization?.name ?? null,
    location: person.location?.display ?? null,
    // Each role is a piece of stated work: its description says what was done and with what.
    workItems: roles.map((r) => ({
      title: [r?.title, r?.organization?.name].filter(Boolean).join(', '),
      description: r?.description ?? null,
      tools: [],
      sinceYear: year(r?.start_date),
      year: r?.is_current ? now : (year(r?.end_date) ?? year(r?.start_date)),
    })),
    tools: [...new Set([...skills, ...named])],
    education: schools.map((e: any) => ({
      institution: e?.institution?.name ?? null,
      degree: e?.degree ?? null,
      field: e?.field_of_study ?? null,
      endYear: year(e?.end_date),
    })),
    experience: roles.map((r) => ({
      title: r?.title ?? null,
      organization: r?.organization?.name ?? null,
      startYear: year(r?.start_date),
      endYear: r?.is_current ? null : year(r?.end_date),
    })),
    counts: {},
    commitMessages: [],
  }
}

/**
 * The follower or subscriber count on a profile page. Some sites answer the first request with
 * an almost empty page, so a page without a count is read once more.
 */
async function readFollowers(url: string): Promise<{ followers: number | null; pages: number; credits: number }> {
  let pages = 0
  let credits = 0
  for (let attempt = 0; attempt < 2; attempt++) {
    const page = await scrape(url, { markdown: true }).catch(() => null)
    if (page?.ok) pages++
    credits += page?.credits ?? 0
    const followers = page?.ok ? parseFollowers(page.markdown ?? '') : null
    if (followers !== null) return { followers, pages, credits }
  }
  return { followers: null, pages, credits }
}

async function collectLink(url: string, repositories: string[] = []): Promise<Source> {
  const platform = platformOf(url)
  const base = { url, platform: platform.id, basis: platform.basis, fetchedAt: new Date().toISOString() }
  try {
    if (platform.id === 'github') {
      const target = githubTarget(url)
      if (!target) return { ...base, status: 'failed', error: 'NOT_A_PROFILE', pages: 0, credits: 0 }
      const result = await collectGithub(target.login, repositories)
      return {
        ...base,
        status: result.data ? 'ok' : 'failed',
        error: result.error,
        pages: result.pages,
        credits: result.credits,
        data: result.data,
      }
    }
    if (platform.id === 'linkedin') {
      // Context.dev looks the person up for their roles and education. The profile page itself
      // can be read for some people only; when it can, it says how many follow them.
      const [found, page] = await Promise.all([enrichPerson(url), scrape(url, { markdown: true }).catch(() => null)])
      const followers = page?.ok ? parseFollowers(page.markdown ?? '') : null
      if (!found && followers === null) {
        return { ...base, status: 'failed', error: 'PROFILE_NOT_FOUND', pages: 1, credits: page?.credits ?? 0 }
      }
      const data: SourceData = found
        ? fromPerson(found.person)
        : { workItems: [], tools: [], education: [], experience: [], counts: {}, commitMessages: [] }
      if (followers !== null) data.counts.followers = followers
      return {
        ...base,
        status: 'ok',
        pages: page?.ok ? 2 : 1,
        credits: (found?.credits ?? 0) + (page?.credits ?? 0),
        data,
      }
    }
    if (hasAudience(platform.id)) {
      // A social profile: what it shows is read like any page, and its follower count is read
      // from the page text with rules, which does not depend on a model noticing it.
      const [result, audience] = await Promise.all([extractPage(url), readFollowers(url)])
      const data: SourceData | undefined =
        result.data ??
        (audience.followers === null
          ? undefined
          : { workItems: [], tools: [], education: [], experience: [], counts: {}, commitMessages: [] })
      if (data && audience.followers !== null) data.counts.followers = audience.followers
      return {
        ...base,
        status: data ? 'ok' : 'failed',
        error: data ? undefined : result.error,
        pages: 1 + audience.pages,
        credits: result.credits + audience.credits,
        data,
      }
    }
    const result = await extractPage(url)
    return {
      ...base,
      status: result.data ? 'ok' : 'failed',
      error: result.error,
      pages: 1,
      credits: result.credits,
      data: result.data,
    }
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      pages: 0,
      credits: 0,
    }
  }
}

async function collectCv(cv: { bytes: Uint8Array; extension: string }): Promise<Source> {
  const base = { url: 'cv', platform: 'cv', basis: 'claimed' as const, fetchedAt: new Date().toISOString() }
  try {
    const parsed = await parseFile(cv.bytes, cv.extension)
    const source = { ...base, markdown: parsed.markdown, pages: 1, credits: parsed.credits }
    if (!parsed.markdown.trim()) return { ...source, status: 'failed', error: 'NO_TEXT_IN_FILE' }
    const data = parseCv(parsed.markdown)
    if (!data.education.length && !data.experience.length && !data.workItems.length && !data.tools.length)
      return { ...source, status: 'failed', error: 'NO_CV_DATA', data }
    return { ...source, status: 'ok', data }
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      pages: 0,
      credits: 0,
    }
  }
}

export interface ApplicationInput {
  links: string[]
  declaredFields: FieldId[]
  cv?: { bytes: Uint8Array; extension: string }
  /** Shown instead of the name; generated when missing. */
  alias?: string
}

export async function collectApplicant(input: ApplicationInput): Promise<Applicant> {
  const links = parseLinks(input.links.join('\n')).links.map((link) => link.url)
  // Read each GitHub account once, retaining all repositories the applicant singled out.
  const accounts = new Map<string, { url: string; repositories: string[] }>()
  const other: string[] = []
  for (const url of links) {
    const target = githubTarget(url)
    if (!target) {
      other.push(url)
      continue
    }
    const account = accounts.get(target.login) ?? { url, repositories: [] }
    if (target.repo) account.repositories.push(target.repo)
    accounts.set(target.login, account)
  }
  const sources = await Promise.all([
    ...[...accounts.values()].map((account) => collectLink(account.url, account.repositories)),
    ...other.map((url) => collectLink(url)),
    ...(input.cv ? [collectCv(input.cv)] : []),
  ])
  const id = crypto.randomUUID().slice(0, 8)
  return {
    id,
    alias: input.alias ?? `Applicant ${id.slice(0, 4).toUpperCase()}`,
    declaredFields: input.declaredFields,
    links,
    hasCv: !!input.cv,
    sources,
    signals: computeSignals(sources),
    createdAt: new Date().toISOString(),
  }
}
