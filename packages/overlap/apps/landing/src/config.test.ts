import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vite-plus/test'

import { HANDOFF_PARAM, HANDOFF_VALUE, platformEntryFields, platformEntryUrl } from './config'

describe('the platform entry URL from /get-started', () => {
  it('adds the handoff to a relative URL', () => {
    expect(platformEntryUrl('/app/')).toBe('/app/?from=get-started')
    expect(platformEntryUrl('app')).toBe('app?from=get-started')
  })

  it('adds the handoff to an absolute URL', () => {
    // The organiser view in development (PRESELECT_URL).
    expect(platformEntryUrl('http://localhost:4322/')).toBe('http://localhost:4322/?from=get-started')
    expect(platformEntryUrl('https://app.example.com')).toBe('https://app.example.com?from=get-started')
    expect(platformEntryUrl('https://app.example.com/overlap/')).toBe(
      'https://app.example.com/overlap/?from=get-started',
    )
  })

  it('keeps the URL’s own query and hash', () => {
    expect(platformEntryUrl('/app/?lang=fi')).toBe('/app/?lang=fi&from=get-started')
    expect(platformEntryUrl('/app/#events')).toBe('/app/?from=get-started#events')
    expect(platformEntryUrl('https://app.example.com/?a=1&b=2#top')).toBe(
      'https://app.example.com/?a=1&b=2&from=get-started#top',
    )
    // A "?" in the hash belongs to the hash.
    expect(platformEntryUrl('/app/#/x?y=1')).toBe('/app/?from=get-started#/x?y=1')
    expect(platformEntryUrl('/app/?')).toBe('/app/?from=get-started')
  })

  it('sets the handoff once, also where the URL already has the parameter', () => {
    expect(platformEntryUrl('/app/?from=elsewhere&lang=fi')).toBe('/app/?from=get-started&lang=fi')
  })

  it('is what the form on /get-started submits', () => {
    // A GET form replaces its action's query with its fields and keeps the action's hash.
    const submitted = (action: string) => {
      const hashAt = action.indexOf('#')
      const hash = hashAt === -1 ? '' : action.slice(hashAt)
      const path = action.replace(/[?#].*$/, '')
      return `${path}?${new URLSearchParams(platformEntryFields(action))}${hash}`
    }
    for (const url of ['/app/', '/app/?lang=fi#events', 'https://app.example.com/?a=1&b=2#top']) {
      expect(submitted(url), url).toBe(platformEntryUrl(url))
    }
    expect(platformEntryFields('/app/')).toEqual([['from', 'get-started']])
  })
})

describe('the handoff', () => {
  // The app reads the query in its own source; the two apps share no code. Keep them in step.
  const app = readFileSync(new URL('../../app/src/lib/handoff.ts', import.meta.url), 'utf8')
  const constant = (name: string) => new RegExp(`export const ${name} = '([^']*)'`).exec(app)?.[1]

  it('has the same query name and value in the app (apps/app/src/lib/handoff.ts)', () => {
    expect(constant('HANDOFF_PARAM')).toBe(HANDOFF_PARAM)
    expect(constant('HANDOFF_VALUE')).toBe(HANDOFF_VALUE)
  })
})
