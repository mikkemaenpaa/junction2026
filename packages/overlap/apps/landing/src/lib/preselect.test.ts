import { describe, expect, it } from 'vite-plus/test'
import { SKULL_ASK } from '@/data/events'
import { looksLikeProfile, overlapLine } from './preselect'

describe('profile or ask', () => {
  it('takes addresses, "site: name" and ORCID iDs as profiles', () => {
    for (const text of [
      'https://example.org/work',
      'linkedin.com/ada-example',
      'my code is at github.com/adaexample',
      'adaexample.dev',
      'www.adaexample.fi',
      'github: adaexample',
      '0000-0002-1825-0097',
    ]) {
      expect(looksLikeProfile(text), text).toBe(true)
    }
  })

  it('leaves ordinary asks alone', () => {
    for (const text of ['Hackathons in Helsinki this autumn', 'Node.js meetups, e.g. in Espoo', 'AI, online only']) {
      expect(looksLikeProfile(text), text).toBe(false)
    }
  })

  // A profile goes to the pre-selection backend instead of the search, so it would not end in the
  // no-fit flash that shows the skulls.
  it('takes the skull ask for an ask', () => {
    expect(looksLikeProfile(SKULL_ASK)).toBe(false)
  })
})

describe('the overlap in one line', () => {
  const event = 'Deep Tech Talent Forum'

  it('names up to three companies and counts the rest', () => {
    expect(overlapLine(event, ['Radio'])).toBe('You match 1 company at Deep Tech Talent Forum: Radio.')
    expect(overlapLine(event, ['Radio', 'Boards'])).toBe(
      'You match 2 companies at Deep Tech Talent Forum: Radio and Boards.',
    )
    expect(overlapLine(event, ['Radio', 'Boards', 'Chips', 'Lasers', 'Qubits'])).toBe(
      'You match 5 companies at Deep Tech Talent Forum: Radio, Boards, Chips and 2 more.',
    )
  })

  it('says nothing when there is no overlap', () => {
    expect(overlapLine(event, [])).toBeNull()
  })
})
