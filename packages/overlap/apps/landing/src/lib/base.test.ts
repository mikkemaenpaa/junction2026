import { describe, expect, it } from 'vite-plus/test'

import { sitePath, withBase } from './base'

describe('withBase', () => {
  it('keeps paths as they are at the root', () => {
    for (const base of ['/', '', '//']) {
      expect(withBase(base, '/')).toBe('/')
      expect(withBase(base, '/get-started')).toBe('/get-started')
      expect(withBase(base, '/#how')).toBe('/#how')
    }
  })

  it('puts paths below the base, whatever its slashes', () => {
    for (const base of ['/submission', '/submission/', 'submission']) {
      expect(withBase(base, '/get-started')).toBe('/submission/get-started')
      expect(withBase(base, '/app/')).toBe('/submission/app/')
      expect(withBase(base, '/events/a.webp')).toBe('/submission/events/a.webp')
      expect(withBase(base, '/og.png')).toBe('/submission/og.png')
    }
  })

  it('makes the home page the base without a trailing slash', () => {
    expect(withBase('/submission', '/')).toBe('/submission')
    expect(withBase('/submission', '/#how')).toBe('/submission#how')
    expect(withBase('/submission', '/?a=1')).toBe('/submission?a=1')
    expect(withBase('/a/b/', '/')).toBe('/a/b')
  })

  it('refuses URLs that are not root-relative', () => {
    for (const path of ['get-started', 'https://example.com/', '//example.com/x', '']) {
      expect(() => withBase('/submission', path), path).toThrow()
    }
  })
})

describe('sitePath', () => {
  it('uses the base of this build (the root under the tests)', () => {
    expect(sitePath('/get-started')).toBe(withBase(import.meta.env.BASE_URL, '/get-started'))
  })
})
