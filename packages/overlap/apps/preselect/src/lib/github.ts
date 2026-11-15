// GitHub profiles are read page by page as Markdown (1 Context.dev credit each) and parsed
// here with plain rules. Unlike AI extraction this gives exact numbers for the things that
// matter most on a code portfolio: languages, commit counts, contribution activity and the
// commit messages themselves.
import { scrape } from './contextdev.ts'
import { FIELD_FIT_INSTRUCTIONS, FIELD_FIT_SCHEMA, fieldRelevance } from './extract.ts'
import { toolsInText } from './taxonomy.ts'
import type { FieldId, SourceData, WorkItem } from './types.ts'

// Paths under github.com that are not user profiles.
const RESERVED = new Set([
  'topics',
  'orgs',
  'search',
  'features',
  'marketplace',
  'explore',
  'collections',
  'trending',
  'sponsors',
  'settings',
  'login',
  'signup',
  'about',
  'pricing',
  'enterprise',
  'apps',
  'notifications',
  'issues',
  'pulls',
])

/** The account (and repository, if any) a GitHub URL points to. */
export function githubTarget(url: string): { login: string; repo?: string } | null {
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (!/^(www\.)?github\.com$/i.test(u.hostname)) return null
  const [login, repo] = u.pathname.split('/').filter(Boolean)
  if (!login || RESERVED.has(login.toLowerCase())) return null
  return repo ? { login, repo } : { login }
}

/** "4.9k", "332k", "255,661" as numbers. */
export function parseCount(text: string | undefined | null): number | null {
  if (!text) return null
  const m = text
    .trim()
    .toLowerCase()
    .match(/^([\d.,]+)\s*([km])?$/)
  if (!m) return null
  const n = Number(m[1]!.replace(/,/g, ''))
  if (!Number.isFinite(n)) return null
  return Math.round(n * (m[2] === 'k' ? 1_000 : m[2] === 'm' ? 1_000_000 : 1))
}

const MONTHS = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'

export interface GithubProfile {
  isOrg: boolean
  login: string | null
  name: string | null
  bio: string | null
  organization: string | null
  location: string | null
  followers: number | null
  repoCount: number | null
  contributionsLastYear: number | null
  activeDaysLastYear: number | null
  activeSinceYear: number | null
}

export function parseProfile(md: string, login: string): GithubProfile {
  const isOrg = new RegExp(`github\\.com/orgs/${login}/`, 'i').test(md)
  const heading = md.match(/^# (.+)$/m)?.[1]?.trim() ?? ''
  // "Linus Torvalds torvalds": the login closes the heading; a profile without a name has
  // only the login.
  const name = heading.toLowerCase().endsWith(login.toLowerCase()) ? heading.slice(0, -login.length).trim() : heading

  // The bio sits between the Follow button under the heading and the follower line.
  const headingAt = Math.max(0, md.search(/^# /m))
  const followLine = md.indexOf('\n[Follow](', headingAt)
  const followersLine = md.search(/^\[[\d.,]+[km]?\s+followers?\]/im)
  const bio =
    followLine >= 0 && followersLine > followLine
      ? md
          .slice(md.indexOf('\n', followLine + 1), followersLine)
          .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
          .replace(/\s+/g, ' ')
          .trim()
      : ''

  // The bullets under the follower line: company and location as plain text, then local
  // time and links.
  const plain: string[] = []
  if (followersLine >= 0) {
    const after = md.slice(followersLine)
    const end = after.search(/^## /m)
    for (const line of after.slice(0, end >= 0 ? end : 600).split('\n')) {
      const item = line.match(/^- (.+)$/)?.[1]?.trim()
      if (item && !item.includes('](') && !/^\d{1,2}:\d{2}/.test(item)) plain.push(item)
    }
  }
  const [organization, location] =
    plain.length >= 2 ? [plain[0]!, plain[1]!] : plain.length === 1 ? [null, plain[0]!] : [null, null]

  const years = [...md.matchAll(/\[(20\d\d)\]\([^)]*tab=overview[^)]*\)/g)].map((m) => Number(m[1]))
  const activeDays = [...md.matchAll(/(\d+) contributions? on /g)].length
  const contributions = parseCount(md.match(/##\s+([\d,]+)\s+contributions?\s+in the last year/)?.[1])

  return {
    isOrg,
    login,
    name: name || null,
    bio: bio || null,
    organization,
    location,
    followers: parseCount(md.match(/\[([\d.,]+[km]?)\s+followers?\]/i)?.[1]),
    repoCount: parseCount(md.match(/\[Repositories\s+([\d.,]+[km]?)\]/)?.[1]),
    contributionsLastYear: contributions,
    activeDaysLastYear: contributions === null ? null : activeDays,
    activeSinceYear: years.length ? Math.min(...years) : null,
  }
}

export interface GithubRepo {
  name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  fork: boolean
  updatedYear: number | null
}

const LICENSE =
  /\s*(?:MIT License|Apache License 2\.0|ISC License|The Unlicense|Other|(?:GNU|BSD|Mozilla|Creative Commons|Eclipse|Boost|Artistic|Do What)[^[\]]*?(?:License|Universal|Public)[^[\]]*?)\s*$/i

/** The repositories listed on a profile's Repositories tab. */
export function parseRepoList(md: string, login: string): GithubRepo[] {
  const repos: GithubRepo[] = []
  const blocks = md.split(/^- ### /m).slice(1)
  for (const block of blocks) {
    const head = block.match(/^\[([^\]]+)\]\((https:\/\/github\.com\/[^)\s]+)\)/)
    if (!head) continue
    const [, shown, url] = head as unknown as [string, string, string]
    // Markdown escapes the underscores in a name ("my\_repo").
    const name = shown.replace(/\\(.)/g, '$1')
    if (!url.toLowerCase().startsWith(`https://github.com/${login.toLowerCase()}/`)) continue
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const metaIndex = lines.findIndex((l) => /\bUpdated\b/.test(l))
    const meta = metaIndex >= 0 ? lines[metaIndex]! : ''
    const fork = lines.some((l) => l.startsWith('Forked from'))
    const description =
      lines.slice(1, metaIndex >= 0 ? metaIndex : undefined).find((l) => !l.startsWith('Forked from')) ?? null

    const stars = parseCount(meta.match(/\[([\d.,]+[km]?)\]\([^)]*\/stargazers\)/)?.[1]) ?? 0
    const updated = meta.match(/Updated\s+(.*)$/)?.[1] ?? ''
    const updatedYear = Number(updated.match(/\b(20\d\d)\b/)?.[1]) || (updated ? new Date().getFullYear() : null)
    // What is left before the first link and before "Updated", minus a licence name, is the
    // primary language.
    const language =
      meta
        .replace(/Updated.*$/, '')
        .replace(/\[.*$/, '')
        .replace(LICENSE, '')
        .trim() || null

    repos.push({ name, url, description, language, stars, fork, updatedYear })
  }
  return repos
}

export interface GithubRepoPage {
  about: string | null
  stars: number | null
  commits: number | null
  contributors: number | null
  /** Language shares, 0 to 1. */
  languages: Record<string, number>
  readme: string
  fork: boolean
}

export function parseRepoPage(md: string): GithubRepoPage {
  const aboutAt = md.indexOf('## About')
  const about =
    aboutAt >= 0
      ? (md
          .slice(aboutAt + 8, aboutAt + 600)
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l && !l.startsWith('[') && !l.startsWith('#')) ?? null)
      : null
  const languages: Record<string, number> = {}
  for (const m of md.matchAll(/^- \[([^\]\d][^\]]*?)([\d.]+)%\]\([^)]*search\?l=/gm)) {
    if (m[1] !== 'Other') languages[m[1]!] = Number(m[2]) / 100
  }
  const readmeAt = md.indexOf('## Repository files navigation')
  const readmeEnd = readmeAt >= 0 ? md.indexOf('\n## About', readmeAt) : -1
  return {
    fork: /\bforked from\b/i.test(md.slice(0, readmeAt >= 0 ? readmeAt : undefined)),
    about: about === 'No description, website, or topics provided.' ? null : about,
    stars: parseCount(md.match(/\*\*([\d.,]+[km]?)\*\* stars?/)?.[1]),
    commits: parseCount(md.match(/\[([\d,]+) Commits?\]/)?.[1]),
    contributors: parseCount(md.match(/## \[Contributors\]\([^)]*\)([\d,]+)/)?.[1]),
    languages,
    readme: readmeAt >= 0 ? md.slice(readmeAt, readmeEnd > readmeAt ? readmeEnd : readmeAt + 8000).slice(0, 8000) : '',
  }
}

/** Commit message titles on a repository's commit list, newest first. */
export function parseCommitList(md: string): { messages: string[]; days: number } {
  const messages = [
    ...md.matchAll(/^\s*- #### \[([^\]]+)\]\(https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/commit\/[0-9a-f]{7,40}/gm),
  ].map((m) => m[1]!.trim())
  const days = new Set(
    [...md.matchAll(new RegExp(`Commits on ((?:${MONTHS}) \\d{1,2}, \\d{4})`, 'g'))].map((m) => m[1]),
  ).size
  return { messages, days }
}

// How many of a person's repositories are opened individually, and for how many of those
// the commit list is read as well.
const REPO_FIT_SCHEMA = {
  type: 'object',
  properties: {
    repositories: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, field_fit: FIELD_FIT_SCHEMA },
        required: ['name', 'field_fit'],
      },
    },
  },
  required: ['repositories'],
}

const REPO_FIT_INSTRUCTIONS = [
  "This page lists one person's public repositories on GitHub. For every repository on it give its name",
  'exactly as shown, without the owner, and field_fit judged from its name, description and language.',
  FIELD_FIT_INSTRUCTIONS,
].join(' ')

/** A repository's name as the key its judgement is found by: no owner, no Markdown escapes, lower case. */
export const repoKey = (name: string) => name.replace(/\\/g, '').split('/').pop()!.trim().toLowerCase()

/**
 * What a model makes of each repository on the list page, by `repoKey`. The page parsers
 * above read the facts; this one extra read judges which field each repository is work in, so
 * that does not hang on keywords alone.
 */
export async function classifyRepos(
  login: string,
): Promise<{ fit: Map<string, Partial<Record<FieldId, number>>>; credits: number; error?: string }> {
  const result = await scrape(`https://github.com/${login}?tab=repositories`, {
    json: { schema: REPO_FIT_SCHEMA, instructions: REPO_FIT_INSTRUCTIONS },
  })
  const fit = new Map<string, Partial<Record<FieldId, number>>>()
  const listed: unknown[] = Array.isArray(result.json?.repositories) ? result.json.repositories : []
  for (const repo of listed as { name?: unknown; field_fit?: unknown }[]) {
    const relevance = fieldRelevance(repo?.field_fit)
    if (typeof repo?.name === 'string' && relevance) fit.set(repoKey(repo.name), relevance)
  }
  return { fit, credits: result.credits, error: result.ok ? undefined : result.error }
}

const REPO_PAGES = 3
const COMMIT_LISTS = 2

export interface GithubResult {
  data?: SourceData
  error?: string
  pages: number
  credits: number
}

/** Read the profile and list, then every explicitly chosen repository before other top repositories. */
export async function collectGithub(login: string, repositories: string[] = []): Promise<GithubResult> {
  let pages = 0
  let credits = 0
  let firstError: string | undefined
  const page = async (url: string) => {
    const result = await scrape(url, { markdown: true })
    pages++
    credits += result.credits
    if (!result.ok || !result.markdown?.trim()) firstError ??= result.error ?? 'EMPTY_PAGE'
    return result.ok ? (result.markdown ?? '') : ''
  }

  const [profileMd, reposMd] = await Promise.all([
    page(`https://github.com/${login}`),
    page(`https://github.com/${login}?tab=repositories`),
  ])
  if (!profileMd) return { error: firstError ?? 'PROFILE_NOT_READABLE', pages, credits }

  const profile = parseProfile(profileMd, login)
  if (profile.isOrg) return { error: 'ORGANISATION_NOT_A_PERSON', pages, credits }
  const repos = parseRepoList(reposMd, login)

  const own = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stars - a.stars || (b.updatedYear ?? 0) - (a.updatedYear ?? 0))
  const requested = new Set(repositories.map(repoKey))
  const preferred: GithubRepo[] = [...requested].map(
    (name) =>
      repos.find((r) => repoKey(r.name) === name) ?? {
        name,
        url: `https://github.com/${login}/${name}`,
        description: null,
        language: null,
        stars: 0,
        fork: false,
        updatedYear: null,
      },
  )
  const top = [
    ...preferred,
    ...own.filter((r) => !requested.has(repoKey(r.name))).slice(0, Math.max(0, REPO_PAGES - preferred.length)),
  ]
  const [repoPages, judged] = await Promise.all([
    Promise.all(
      top.map(async (repo) => {
        const markdown = await page(repo.url)
        // A login/error page must not turn an unlisted repository into invented work.
        if (!/^## (?:About|Repository files navigation)\s*$/m.test(markdown)) {
          firstError ??= 'REPOSITORY_NOT_READABLE'
          return null
        }
        return parseRepoPage(markdown)
      }),
    ),
    // A failed judgement is not fatal: the fields then come from the words, as before.
    classifyRepos(login).catch(() => ({ fit: new Map<string, Partial<Record<FieldId, number>>>(), credits: 0 })),
  ])
  pages++
  credits += judged.credits

  const commitLists = await Promise.all(
    top
      .filter((repo, i) => repoPages[i] && !repo.fork && !repoPages[i]!.fork)
      .slice(0, COMMIT_LISTS)
      .map((repo) => page(`${repo.url}/commits?author=${login}`).then(parseCommitList)),
  )
  const allRepos = [...repos, ...preferred.filter((repo) => !repos.includes(repo) && repoPages[top.indexOf(repo)])]
  const workItems: WorkItem[] = allRepos.map((repo) => {
    const detail = repoPages[top.indexOf(repo)]
    const text = [repo.description, detail?.about, detail?.readme].filter(Boolean).join('\n')
    const tools = new Set<string>(toolsInText(text).map((t) => t.name))
    if (repo.language) tools.add(repo.language)
    for (const [language, share] of Object.entries(detail?.languages ?? {})) if (share >= 0.1) tools.add(language)
    return {
      title: repo.name,
      description: repo.description ?? detail?.about ?? null,
      tools: [...tools],
      year: repo.updatedYear,
      url: repo.url,
      popularity: detail?.stars ?? repo.stars,
      languages:
        detail?.languages && Object.keys(detail.languages).length
          ? detail.languages
          : repo.language
            ? { [repo.language]: 1 }
            : undefined,
      commits: detail?.commits ?? null,
      fork: repo.fork || detail?.fork || false,
      fieldRelevance: judged.fit.get(repoKey(repo.name)),
    }
  })

  return {
    pages,
    credits,
    error: firstError,
    data: {
      personName: profile.name,
      headline: profile.bio,
      organization: profile.organization,
      location: profile.location,
      workItems,
      tools: toolsInText(profile.bio ?? '').map((t) => t.name),
      education: [],
      experience: [],
      counts: {
        workItems: Math.max(profile.repoCount ?? 0, allRepos.length),
        contributionsLastYear: profile.contributionsLastYear,
        activeDaysLastYear: profile.activeDaysLastYear,
        followers: profile.followers,
        activeSinceYear: profile.activeSinceYear,
      },
      commitMessages: commitLists.flatMap((c) => c.messages).slice(0, 80),
    },
  }
}
