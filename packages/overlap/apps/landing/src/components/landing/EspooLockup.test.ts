import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'

import { EspooLockup } from './EspooLockup'

// The lockup exists twice: as a file (for use outside the page) and inline in the component.
const file = readFileSync(new URL('../../assets/espoo-overlap.svg', import.meta.url), 'utf8')
const markup = renderToStaticMarkup(createElement(EspooLockup))

const viewBox = (svg: string) => /viewBox="([^"]+)"/.exec(svg)?.[1]
const paths = (svg: string) => Array.from(svg.matchAll(/<path d="([^"]+)"/g), (match) => match[1])

describe('EspooLockup', () => {
  it('draws the same artwork as src/assets/espoo-overlap.svg', () => {
    expect(viewBox(markup)).toBe(viewBox(file))
    expect(paths(markup)).toEqual(paths(file))
    expect(paths(file)).toHaveLength(3)
  })

  it('keeps the City of Espoo logo as supplied', () => {
    // SHA-256 of the two paths of the supplied logo, joined by a line feed. The logo may not be
    // redrawn: if this fails, restore the paths; do not update the hash.
    const logo = paths(file).slice(0, 2).join('\n')
    expect(createHash('sha256').update(logo).digest('hex')).toBe(
      'c29da9fbc539cbc12df11732a1fe2b35638fce8a86232d57e968788a596ac23f',
    )
  })

  it('is named by its words and paints with the text colour only', () => {
    const title = /<title>([^<]+)<\/title>/.exec(file)?.[1]
    expect(title).toBe('City of Espoo Overlap')
    expect(markup).toContain(`<span class="espoo-lockup-label">${title}</span>`)
    expect(markup).toContain('aria-hidden="true"')
    for (const svg of [file, markup]) {
      expect(svg).not.toMatch(/<text|font-family|#[0-9a-f]{3,8}\b|rgb\(|stroke=/i)
      expect(svg.match(/fill="[^"]*"/g)).toEqual(['fill="currentColor"'])
    }
  })
})
