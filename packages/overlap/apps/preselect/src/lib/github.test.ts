import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { collectApplicant } from './collect.ts'
import { scrape } from './contextdev.ts'
import { collectGithub } from './github.ts'

vi.mock('./contextdev.ts', () => ({ scrape: vi.fn(), parseFile: vi.fn(), enrichPerson: vi.fn() }))

const root = 'https://github.com/ada'
const profile = '# Ada ada\n[Repositories 5](https://github.com/ada?tab=repositories)'
const listing = ['popular', 'second', 'third']
  .map(
    (name, i) =>
      `- ### [${name}](${root}/${name})\nFirmware\nRust [${100 - i}](${root}/${name}/stargazers) Updated Jan 1, 2025`,
  )
  .join('\n')
const detail = '## Repository files navigation\nRust sensor firmware\n## About\nLow-power firmware\n**12** stars'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(scrape).mockImplementation(async (url, options) => {
    if (options.json) return { ok: true, json: { repositories: [] }, credits: 5 }
    const markdown =
      url === root
        ? profile
        : url === `${root}?tab=repositories`
          ? listing
          : url.includes('/commits?')
            ? '# Commits'
            : detail
    return { ok: true, markdown, credits: 1 }
  })
})

describe('explicit GitHub repositories', () => {
  it('opens and includes a chosen repository outside the first listing page', async () => {
    const result = await collectGithub('ada', ['old-project'])
    expect(result.data?.workItems.find((w) => w.url === `${root}/old-project`)).toMatchObject({
      title: 'old-project',
      description: 'Low-power firmware',
      tools: expect.arrayContaining(['Rust']),
      popularity: 12,
    })
    const detailed = vi
      .mocked(scrape)
      .mock.calls.filter(
        ([url, options]) => options.markdown && url.startsWith(`${root}/`) && !url.includes('/commits?'),
      )
    expect(detailed.map(([url]) => url)).toEqual([`${root}/old-project`, `${root}/popular`, `${root}/second`])
  })

  it('reads all explicitly selected repositories even when there are more than three', async () => {
    const selected = ['one', 'two', 'three', 'four']
    const result = await collectGithub('ada', selected)
    for (const name of selected) expect(result.data?.workItems.some((w) => w.url === `${root}/${name}`)).toBe(true)
  })

  it('groups profile and repository links so the account is only collected once', async () => {
    const result = await collectApplicant({
      links: [root, `${root}/old-project`, `${root}/popular`],
      declaredFields: [],
    })
    expect(result.sources).toHaveLength(1)
    expect(result.sources[0]?.data?.workItems.filter((w) => w.url === `${root}/popular`)).toHaveLength(1)
    expect(vi.mocked(scrape).mock.calls.filter(([url]) => url === root)).toHaveLength(1)
    expect(result.links).toContain(`${root}/old-project`)
  })

  it('does not invent an item for an unreadable chosen repository and reports partial failure', async () => {
    const original = vi.mocked(scrape).getMockImplementation()!
    vi.mocked(scrape).mockImplementation((url, options) =>
      url === `${root}/missing`
        ? Promise.resolve({ ok: false, error: 'NOT_FOUND', credits: 0 })
        : original(url, options),
    )
    const result = await collectGithub('ada', ['missing'])
    expect(result.error).toBe('NOT_FOUND')
    expect(result.data?.workItems.some((w) => w.title === 'missing')).toBe(false)
    expect(result.data?.workItems.some((w) => w.title === 'popular')).toBe(true)
  })

  it('recognizes a chosen fork outside the list and does not count it as original work', async () => {
    const original = vi.mocked(scrape).getMockImplementation()!
    vi.mocked(scrape).mockImplementation((url, options) =>
      url === `${root}/fork`
        ? Promise.resolve({
            ok: true,
            markdown: `forked from [upstream/repo](https://github.com/upstream/repo)\n${detail}`,
            credits: 1,
          })
        : original(url, options),
    )
    const result = await collectApplicant({ links: [`${root}/fork`], declaredFields: [] })
    expect(result.sources[0]?.data?.workItems.find((w) => w.title === 'fork')?.fork).toBe(true)
    expect(result.signals.portfolio.listedVerified).toBe(3)
    expect(vi.mocked(scrape).mock.calls.some(([url]) => url.startsWith(`${root}/fork/commits`))).toBe(false)
  })
})
