// Who goes on the organiser's priority list: people whose public reach is so large that the
// organiser should see them first, whatever their score. They take a place among the
// suggestions; whether they are invited is still the organiser's decision. Pure functions.
import type { Priority, Source } from './types.ts'

/** More stars than this on the person's own GitHub repositories puts them on the list. */
export const GITHUB_STARS = 5000

/**
 * So does a larger audience than this on any one channel, by the platform of the link. A LinkedIn
 * post states its author's followers too, so it counts as LinkedIn.
 */
export const AUDIENCE: Record<string, { more: number; label: string }> = {
  linkedin: { more: 10_000, label: 'LinkedIn followers' },
  tiktok: { more: 100_000, label: 'TikTok followers' },
  youtube: { more: 70_000, label: 'YouTube subscribers' },
  facebook: { more: 30_000, label: 'Facebook followers' },
  instagram: { more: 50_000, label: 'Instagram followers' },
  x: { more: 50_000, label: 'X followers' },
}

/** The channel a source's follower count belongs to, if it is one with a threshold. */
const channelOf = (platform: string) => (platform === 'linkedin-post' ? 'linkedin' : platform)

/** Whether the follower count of a link on this platform can put someone on the list. */
export const hasAudience = (platform: string) => channelOf(platform) in AUDIENCE

const UNITS: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 }

function count(digits: string, unit: string | undefined): number | null {
  // With a unit the separator is a decimal point ("1.5K"); without one it groups thousands.
  const value = unit
    ? Number(digits.replace(',', '.')) * UNITS[unit.toLowerCase()]!
    : Number(digits.replace(/[.,]/g, ''))
  return Number.isFinite(value) ? Math.round(value) : null
}

/**
 * The follower or subscriber count on a profile page, however the site writes it: "41M followers",
 * "428.4K Followers", "40,816,435 followers", "**15**Followers" or "Subscribers: 580K". The first
 * one on the page is the profile's own; later ones belong to other people the page suggests.
 */
export function parseFollowers(markdown: string): number | null {
  // Emphasis marks and link brackets can sit between the number and its word.
  const text = markdown.replace(/[*_[\]]/g, '')
  const after = /(\d[\d.,]*)\s?([KMB])?\+?\s*(?:followers|subscribers)\b/i.exec(text)
  const before = /\b(?:followers|subscribers)\s*:\s*(\d[\d.,]*)\s?([KMB])?\b/i.exec(text)
  const found = after && before ? (after.index <= before.index ? after : before) : (after ?? before)
  return found ? count(found[1]!, found[2]) : null
}

const short = (n: number) =>
  n >= 1e6
    ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}M`
    : n >= 1e3
      ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '')}k`
      : String(n)

/** The person's reach and why it puts them on the priority list, or null when it does not. */
export function priorityOf(sources: Source[]): Priority | null {
  const read = sources.filter((source) => source.status === 'ok' && source.data)
  // Stars of the repositories that were read: the first page of the list, forks left out.
  const githubStars = read
    .filter((source) => source.platform === 'github')
    .flatMap((source) => source.data!.workItems)
    .filter((item) => !item.fork)
    .reduce((sum, item) => sum + (item.popularity ?? 0), 0)
  const followers: Record<string, number> = {}
  for (const source of read) {
    const channel = channelOf(source.platform)
    if (channel in AUDIENCE) followers[channel] = Math.max(followers[channel] ?? 0, source.data!.counts.followers ?? 0)
  }
  const reasons = [
    githubStars > GITHUB_STARS ? `${short(githubStars)} GitHub stars` : '',
    ...Object.entries(AUDIENCE).map(([channel, { more, label }]) =>
      (followers[channel] ?? 0) > more ? `${short(followers[channel]!)} ${label}` : '',
    ),
  ].filter(Boolean)
  return reasons.length ? { githubStars, followers, reasons } : null
}
