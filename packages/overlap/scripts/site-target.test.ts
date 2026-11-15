import { describe, expect, it } from 'vite-plus/test'

import { DEFAULT_SITE_BASE, normalizeBase, prefixHeaderRules } from './site-target.mjs'

describe('normalizeBase', () => {
  it('takes the base with or without its slashes', () => {
    for (const value of ['/submission', '/submission/', 'submission', 'submission/', ' /submission// ']) {
      expect(normalizeBase(value), value).toBe('/submission/')
    }
    expect(normalizeBase('/a/b')).toBe('/a/b/')
  })

  it('reads unset, empty and "/" as the root', () => {
    for (const value of [undefined, '', '/', '//', ' ']) expect(normalizeBase(value), String(value)).toBe('/')
  })

  it('refuses anything but a plain path', () => {
    for (const value of ['https://junction2026.com/submission', '/a b', '/a/../b', '/./a', '/a?b', '/a#b', '/a//b']) {
      expect(() => normalizeBase(value), value).toThrow(/SITE_BASE/)
    }
  })

  it('accepts the default', () => {
    expect(normalizeBase(DEFAULT_SITE_BASE)).toBe(DEFAULT_SITE_BASE)
    expect(DEFAULT_SITE_BASE).not.toBe('/')
  })
})

describe('prefixHeaderRules', () => {
  const headers = [
    '# Every response: /* and /app/ in a comment stay as they are.',
    '/*',
    '  X-Content-Type-Options: nosniff',
    "  Content-Security-Policy: default-src 'self'; form-action 'self'",
    '',
    '/_astro/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/app/',
    '  ! Content-Security-Policy',
    "  Content-Security-Policy: default-src 'self'",
    '/app/sw.js',
    '  Cache-Control: no-cache',
    '/',
    '  X-Home: yes',
    '',
  ].join('\n')

  it('moves every rule below the base and keeps the other lines', () => {
    expect(prefixHeaderRules(headers, '/submission/')).toBe(
      [
        '# Every response: /* and /app/ in a comment stay as they are.',
        '/submission*',
        '  X-Content-Type-Options: nosniff',
        "  Content-Security-Policy: default-src 'self'; form-action 'self'",
        '',
        '/submission/_astro/*',
        '  Cache-Control: public, max-age=31536000, immutable',
        '/submission/app/',
        '  ! Content-Security-Policy',
        "  Content-Security-Policy: default-src 'self'",
        '/submission/app/sw.js',
        '  Cache-Control: no-cache',
        '/submission',
        '  X-Home: yes',
        '',
      ].join('\n'),
    )
  })

  it('handles a deeper base, CRLF line ends and the root', () => {
    expect(prefixHeaderRules('/*\r\n  A: b\r\n/events/*\r\n', '/a/b/')).toBe('/a/b*\r\n  A: b\r\n/a/b/events/*\r\n')
    expect(prefixHeaderRules(headers, '/')).toBe(headers)
  })
})
