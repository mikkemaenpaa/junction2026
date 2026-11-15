import { describe, expect, it } from 'vite-plus/test'
import { parseCv } from './cv.ts'
import { githubTarget, parseCommitList, parseCount, parseProfile, parseRepoList, parseRepoPage } from './github.ts'
import { commitQuality, educationLevel } from './signals.ts'
import { fieldsInText, toolFromName, toolsInText } from './taxonomy.ts'

// Markdown in the shape Context.dev returns for GitHub pages, with invented content.
const PROFILE = `
# Ada Example adaexample

[Follow](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fadaexample)

Embedded developer at [@examplecorp](https://github.com/examplecorp)

[1.2k followers](https://github.com/adaexample?tab=followers) · [4 following](https://github.com/adaexample?tab=following)

- Example Corp
- Espoo, Finland
- 18:50 \\- 7h ahead
- [example.com](https://example.com)

## [Achievements](https://github.com/adaexample?tab=achievements)

[Overview](https://github.com/adaexample) [Repositories 34](https://github.com/adaexample?tab=repositories)

## 1,098 contributions in the last year

No contributions on November 9th.7 contributions on July 12th.3 contributions on August 9th.

1. [2026](https://github.com/adaexample?tab=overview&from=2026-11-01&to=2026-11-14)
2. [2019](https://github.com/adaexample?tab=overview&from=2019-12-01&to=2019-12-31)
`

const REPOS = `
Sort Last updated

- ### [sensor-node](https://github.com/adaexample/sensor-node) Public

 Low-power sensor firmware

 C [2,499](https://github.com/adaexample/sensor-node/stargazers) [135](https://github.com/adaexample/sensor-node/forks) GNU General Public License v2.0 Updated Nov 6, 2026

- ### [zephyr](https://github.com/adaexample/zephyr) Public

 Forked from [zephyrproject-rtos/zephyr](https://github.com/zephyrproject-rtos/zephyr)

 C MIT License Updated Oct 18, 2024

- ### [notes](https://github.com/adaexample/notes) Public

 Rust Updated Jul 12, 2026
`

const REPO = `
## History

[18,524 Commits](https://github.com/adaexample/sensor-node/commits/main/)

## Repository files navigation

# sensor-node

Firmware for an STM32 board running FreeRTOS.

## About

Low-power sensor firmware

### Stars

**4.9k** stars

## [Contributors](https://github.com/adaexample/sensor-node/graphs/contributors)12 (12)

## Languages

- [C++49.8%](https://github.com/adaexample/sensor-node/search?l=c%2B%2B)
- [Verilog40.9%](https://github.com/adaexample/sensor-node/search?l=verilog)
- [Other1.7%](https://github.com/adaexample/sensor-node/search?l=Other)
`

const COMMITS = `
## Commits on Jul 12, 2026

 - #### [Add table output and refactor the key reader](https://github.com/adaexample/notes/commit/8fb99b6cc5d3c1031e5245b5f01f0e33a0691cfa 'Add table output')

 - #### [Merge pull request](https://github.com/adaexample/notes/commit/f8e923b25f27184002b474a926b75ab6a8a62a3e 'Merge pull request #1')

## Commits on Jul 10, 2026

 - #### [README](https://github.com/adaexample/notes/commit/4ca0415b283d85d3258aa738aa3739b9f2f56f76 'README')
`

describe('GitHub pages', () => {
  it("reads counts in GitHub's short forms", () => {
    expect(parseCount('4.9k')).toBe(4900)
    expect(parseCount('255,661')).toBe(255661)
    expect(parseCount('332k')).toBe(332000)
    expect(parseCount('many')).toBeNull()
  })

  it('tells accounts from site pages', () => {
    expect(githubTarget('https://github.com/adaexample')).toEqual({ login: 'adaexample' })
    expect(githubTarget('https://github.com/adaexample/notes')).toEqual({ login: 'adaexample', repo: 'notes' })
    expect(githubTarget('https://github.com/topics/verilog')).toBeNull()
    expect(githubTarget('https://gitlab.com/adaexample')).toBeNull()
  })

  it('reads a profile', () => {
    expect(parseProfile(PROFILE, 'adaexample')).toEqual({
      isOrg: false,
      login: 'adaexample',
      name: 'Ada Example',
      bio: 'Embedded developer at @examplecorp',
      organization: 'Example Corp',
      location: 'Espoo, Finland',
      followers: 1200,
      repoCount: 34,
      contributionsLastYear: 1098,
      activeDaysLastYear: 2,
      activeSinceYear: 2019,
    })
  })

  it('reads the repository list with language, stars and forks', () => {
    expect(parseRepoList(REPOS, 'adaexample')).toEqual([
      {
        name: 'sensor-node',
        url: 'https://github.com/adaexample/sensor-node',
        description: 'Low-power sensor firmware',
        language: 'C',
        stars: 2499,
        fork: false,
        updatedYear: 2026,
      },
      {
        name: 'zephyr',
        url: 'https://github.com/adaexample/zephyr',
        description: null,
        language: 'C',
        stars: 0,
        fork: true,
        updatedYear: 2024,
      },
      {
        name: 'notes',
        url: 'https://github.com/adaexample/notes',
        description: null,
        language: 'Rust',
        stars: 0,
        fork: false,
        updatedYear: 2026,
      },
    ])
  })

  it('reads a repository page', () => {
    const page = parseRepoPage(REPO)
    expect(page.commits).toBe(18524)
    expect(page.stars).toBe(4900)
    expect(page.contributors).toBe(12)
    expect(page.about).toBe('Low-power sensor firmware')
    expect(page.languages).toEqual({ 'C++': 0.498, Verilog: 0.409 })
    expect(page.readme).toContain('FreeRTOS')
  })

  it('reads commit messages and the days they were made on', () => {
    expect(parseCommitList(COMMITS)).toEqual({
      messages: ['Add table output and refactor the key reader', 'Merge pull request', 'README'],
      days: 2,
    })
  })
})

describe('commit messages', () => {
  it('rates descriptive messages above vague ones and ignores merges', () => {
    const clear = [
      'Add retry with backoff to the API client',
      'Fix off-by-one in quota rounding',
      'Read language shares from the repository page',
      'Document the collection script',
      'Remove the unused cache layer',
    ]
    const vague = ['update', 'fix', 'wip', 'changes', 'asdf']
    expect(commitQuality(clear)).toBe(1)
    expect(commitQuality(vague)).toBe(0)
    expect(commitQuality(['Merge pull request', ...clear])).toBe(1)
    expect(commitQuality(clear.slice(0, 3))).toBeNull()
  })
})

describe('skills and fields', () => {
  it('maps language and tool names to known skills', () => {
    expect(toolFromName('cpp')?.name).toBe('C++')
    expect(toolFromName('C')?.name).toBe('C')
    expect(toolFromName('PyTorch Lightning')?.name).toBe('PyTorch')
    expect(toolFromName('neural networks')?.name).toBe('Deep learning')
    expect(toolFromName('TypeScript')).toBeNull()
  })

  it('finds tools and subject areas in running text', () => {
    const names = (text: string) => toolsInText(text).map((t) => t.name)
    expect(names('Firmware for an STM32 board with FreeRTOS, written in C')).toEqual(
      expect.arrayContaining(['STM32', 'FreeRTOS', 'Firmware']),
    )
    expect(names('Suppressing quantum errors by scaling a surface code logical qubit')).toEqual(
      expect.arrayContaining(['Quantum computing', 'Quantum error correction']),
    )
    // A single letter is too ambiguous to trust in prose.
    expect(names('Plan C for the weekend')).toEqual([])
    // The art printing technique is not semiconductor lithography.
    expect(names('A lithography print series on paper')).toEqual([])
    expect(names('My sourdough bread recipe and a basic travel itinerary')).toEqual([])
  })

  it('does not mistake everyday words for field keywords', () => {
    expect(fieldsInText('A workspace for Hugging Face Spaces with social features')).toEqual([])
    expect(fieldsInText('Telemetry for a CubeSat payload')).toContain('space')
  })

  it('ranks degrees', () => {
    expect(educationLevel('PhD in Physics').level).toBe(4)
    expect(educationLevel('M.Sc. (Tech), Electrical Engineering').level).toBe(3)
    expect(educationLevel('Bachelor of Engineering').level).toBe(2)
    expect(educationLevel('Vocational qualification in agriculture').level).toBe(1)
    expect(educationLevel('Driving licence').level).toBe(0)
  })
})

describe('CV text', () => {
  const CV = `
# Ada Example

Embedded software engineer

## Experience

Firmware engineer, Example Corp 2019 – present
Junior developer, Other Oy 2016 - 2019

## Education

M.Sc. in Electrical Engineering, Aalto University 2016

## Skills

Rust, C++, Zephyr, KiCad
`

  it('reads education, work history and stated skills', () => {
    const cv = parseCv(CV)
    expect(cv.education).toHaveLength(1)
    expect(cv.education[0]).toMatchObject({ field: 'Electrical Engineering', endYear: 2016 })
    expect(cv.experience.map((e) => [e.startYear, e.endYear])).toEqual([
      [2019, null],
      [2016, 2019],
    ])
    expect(cv.tools).toEqual(expect.arrayContaining(['Rust', 'C++', 'Zephyr', 'KiCad']))
  })
})

describe('extraction request', () => {
  it('keeps the instructions within what Context.dev accepts', async () => {
    const { INSTRUCTIONS } = await import('./extract.ts')
    expect(INSTRUCTIONS.length).toBeLessThanOrEqual(2000)
  })
})

describe('platform of a link', () => {
  it('gives the social channels their own name, so a follower count is tied to its channel', async () => {
    const { platformOf } = await import('./extract.ts')
    const id = (url: string) => platformOf(url).id
    expect(id('https://x.com/adaexample')).toBe('x')
    expect(id('https://twitter.com/adaexample')).toBe('x')
    expect(id('https://www.instagram.com/adaexample/')).toBe('instagram')
    expect(id('https://www.tiktok.com/@adaexample')).toBe('tiktok')
    expect(id('https://www.youtube.com/@adaexample')).toBe('youtube')
    expect(id('https://www.facebook.com/adaexample')).toBe('facebook')
    expect(id('https://adaexample.dev')).toBe('web')
  })
})
