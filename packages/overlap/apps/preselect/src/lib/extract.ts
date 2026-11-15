// Any link that is not a GitHub profile is read with Context.dev's JSON extraction: an AI
// model on their side fills the schema below from the page. One schema covers every kind of
// portfolio (research profile, patent list, hardware project log, design gallery, personal
// site), so an applicant can link whatever shows their work.
import { scrape } from './contextdev.ts'
import { FIELDS } from './taxonomy.ts'
import { FIELD_IDS } from './types.ts'
import type { Basis, FieldId, SourceData } from './types.ts'

const nullable = (type: string) => ({ type: [type, 'null'] })

/**
 * How much a piece of work is work in each field, 0 to 100, for the model to fill in. The
 * fields are described here, in the schema: the instructions may be 2000 characters at most.
 */
export const FIELD_FIT_SCHEMA = {
  type: 'object',
  description: '0 = unrelated to the field, 100 = squarely work in that field.',
  properties: Object.fromEntries(
    FIELDS.map((field) => [field.id, { type: 'integer', description: `${field.name}: ${field.description}` }]),
  ),
  required: [...FIELD_IDS],
}

/** What the model is told about judging field_fit. */
export const FIELD_FIT_INSTRUCTIONS = [
  'field_fit: for each field in the schema, how much the item itself is work in that field, from 0',
  '(unrelated) to 100 (squarely work in that field). Judge by what the item is and does, not by words it',
  'happens to contain; most items fit one or two fields and score 0 in the others. The fields are about',
  'building and researching technology: taking photographs, lifestyle topics and writing for a general',
  'audience score 0 in all of them.',
].join(' ')

/** field_fit as the model returned it, as relevance 0 to 1 per field. */
export function fieldRelevance(raw: unknown): Partial<Record<FieldId, number>> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: Partial<Record<FieldId, number>> = {}
  let any = false
  for (const id of FIELD_IDS) {
    const value = (raw as Record<string, unknown>)[id]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    out[id] = Math.min(1, Math.max(0, value / 100))
    any = true
  }
  return any ? out : undefined
}

const SCHEMA = {
  type: 'object',
  properties: {
    person_name: nullable('string'),
    headline: nullable('string'),
    organization: nullable('string'),
    location: nullable('string'),
    work_items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: nullable('string'),
          tools: { type: 'array', items: { type: 'string' } },
          year: nullable('integer'),
          url: nullable('string'),
          popularity: nullable('integer'),
          field_fit: FIELD_FIT_SCHEMA,
        },
        required: ['title', 'tools', 'field_fit'],
      },
    },
    tools: { type: 'array', items: { type: 'string' } },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          institution: nullable('string'),
          degree: nullable('string'),
          field: nullable('string'),
          end_year: nullable('integer'),
        },
      },
    },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: nullable('string'),
          organization: nullable('string'),
          start_year: nullable('integer'),
          end_year: nullable('integer'),
        },
      },
    },
    work_item_count: nullable('integer'),
    publication_count: nullable('integer'),
    citation_count: nullable('integer'),
    h_index: nullable('integer'),
    patent_count: nullable('integer'),
    follower_count: nullable('integer'),
    active_since_year: nullable('integer'),
  },
  required: ['work_items', 'tools', 'education', 'experience'],
}

export const INSTRUCTIONS = [
  'This is a public portfolio or profile page of one person. Extract evidence of their professional skills.',
  'Use only facts stated on the page; leave a field null or empty when the page does not state it.',
  "work_items: the person's own projects, repositories, publications, patents, designs, models, datasets or",
  'case studies listed on the page, at most 25, most significant first. tools on a work item: programming',
  'languages, software, hardware platforms, instruments and technical methods that the item visibly uses.',
  'popularity: stars, citations, likes, views or downloads of that item, if shown.',
  FIELD_FIT_INSTRUCTIONS,
  'tools (top level): tools and methods the page says the person uses, beyond single work items.',
  'The count fields are totals shown on the page (for example total publications or citations), not the',
  'number of items you listed.',
].join(' ')

const int = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null)
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const list = (v: unknown): any[] => (Array.isArray(v) ? v : [])

/** Bring an extracted object into the shape the rest of the app uses. */
export function toSourceData(raw: any): SourceData {
  return {
    personName: str(raw?.person_name),
    headline: str(raw?.headline),
    organization: str(raw?.organization),
    location: str(raw?.location),
    workItems: list(raw?.work_items)
      .filter((w) => str(w?.title))
      .map((w) => ({
        title: str(w.title)!,
        description: str(w.description),
        tools: list(w.tools)
          .map(str)
          .filter((t): t is string => !!t),
        year: int(w.year),
        url: str(w.url),
        popularity: int(w.popularity),
        fieldRelevance: fieldRelevance(w.field_fit),
      })),
    tools: list(raw?.tools)
      .map(str)
      .filter((t): t is string => !!t),
    education: list(raw?.education)
      .map((e) => ({
        institution: str(e?.institution),
        degree: str(e?.degree),
        field: str(e?.field),
        endYear: int(e?.end_year),
      }))
      .filter((e) => e.institution || e.degree || e.field),
    experience: list(raw?.experience)
      .map((e) => ({
        title: str(e?.title),
        organization: str(e?.organization),
        startYear: int(e?.start_year),
        endYear: int(e?.end_year),
      }))
      .filter((e) => e.title || e.organization),
    counts: {
      workItems: int(raw?.work_item_count),
      publications: int(raw?.publication_count),
      citations: int(raw?.citation_count),
      hIndex: int(raw?.h_index),
      patents: int(raw?.patent_count),
      followers: int(raw?.follower_count),
      activeSinceYear: int(raw?.active_since_year),
    },
    commitMessages: [],
  }
}

export interface PlatformInfo {
  id: string
  label: string
  /** Whether the page shows the work itself or only the person's own account of it. */
  basis: Basis
}

const PLATFORMS: [RegExp, PlatformInfo][] = [
  [/(^|\.)github\.com$/, { id: 'github', label: 'GitHub', basis: 'verified' }],
  [/(^|\.)gitlab\.com$/, { id: 'gitlab', label: 'GitLab', basis: 'verified' }],
  [/(^|\.)linkedin\.com$/, { id: 'linkedin', label: 'LinkedIn', basis: 'claimed' }],
  [/^scholar\.google\./, { id: 'scholar', label: 'Google Scholar', basis: 'verified' }],
  [/(^|\.)semanticscholar\.org$/, { id: 'semanticscholar', label: 'Semantic Scholar', basis: 'verified' }],
  [/(^|\.)orcid\.org$/, { id: 'orcid', label: 'ORCID', basis: 'verified' }],
  [/(^|\.)arxiv\.org$/, { id: 'arxiv', label: 'arXiv', basis: 'verified' }],
  [/(^|\.)researchgate\.net$/, { id: 'researchgate', label: 'ResearchGate', basis: 'verified' }],
  [/^patents\.google\.com$/, { id: 'patents', label: 'Google Patents', basis: 'verified' }],
  [/(^|\.)zenodo\.org$/, { id: 'zenodo', label: 'Zenodo', basis: 'verified' }],
  [/(^|\.)osf\.io$/, { id: 'osf', label: 'OSF', basis: 'verified' }],
  [/(^|\.)huggingface\.co$/, { id: 'huggingface', label: 'Hugging Face', basis: 'verified' }],
  [/(^|\.)kaggle\.com$/, { id: 'kaggle', label: 'Kaggle', basis: 'verified' }],
  [/(^|\.)hackaday\.io$/, { id: 'hackaday', label: 'Hackaday.io', basis: 'verified' }],
  [/(^|\.)hackster\.io$/, { id: 'hackster', label: 'Hackster.io', basis: 'verified' }],
  [/(^|\.)oshwlab\.com$/, { id: 'oshwlab', label: 'OSHWLab', basis: 'verified' }],
  [/(^|\.)arduino\.cc$/, { id: 'arduino', label: 'Arduino Project Hub', basis: 'verified' }],
  [/(^|\.)tinytapeout\.com$/, { id: 'tinytapeout', label: 'Tiny Tapeout', basis: 'verified' }],
  [/(^|\.)behance\.net$/, { id: 'behance', label: 'Behance', basis: 'verified' }],
  [/(^|\.)dribbble\.com$/, { id: 'dribbble', label: 'Dribbble', basis: 'verified' }],
  [/(^|\.)sketchfab\.com$/, { id: 'sketchfab', label: 'Sketchfab', basis: 'verified' }],
  [/(^|\.)grabcad\.com$/, { id: 'grabcad', label: 'GrabCAD', basis: 'verified' }],
  [/(^|\.)thingiverse\.com$/, { id: 'thingiverse', label: 'Thingiverse', basis: 'verified' }],
  [/(^|\.)medium\.com$/, { id: 'medium', label: 'Medium', basis: 'verified' }],
  [/(^|\.)stackoverflow\.com$/, { id: 'stackoverflow', label: 'Stack Overflow', basis: 'verified' }],
  [/(^|\.)(x|twitter)\.com$/, { id: 'x', label: 'X', basis: 'verified' }],
  [/(^|\.)instagram\.com$/, { id: 'instagram', label: 'Instagram', basis: 'verified' }],
  [/(^|\.)tiktok\.com$/, { id: 'tiktok', label: 'TikTok', basis: 'verified' }],
  [/(^|\.)(youtube\.com|youtu\.be)$/, { id: 'youtube', label: 'YouTube', basis: 'verified' }],
  [/(^|\.)(facebook|fb)\.com$/, { id: 'facebook', label: 'Facebook', basis: 'verified' }],
  [/(^|\.)snapchat\.com$/, { id: 'snapchat', label: 'Snapchat', basis: 'verified' }],
]

/** Which platform a link belongs to; anything unknown is treated as a personal website. */
export function platformOf(url: string): PlatformInfo {
  try {
    const { hostname, pathname } = new URL(url)
    const host = hostname.toLowerCase().replace(/^www\./, '')
    // A LinkedIn profile only states things, but a single post or article is public writing
    // that can be read like any other page.
    if (/(^|\.)linkedin\.com$/.test(host) && /^\/(posts|pulse)\/./.test(pathname))
      return { id: 'linkedin-post', label: 'LinkedIn post', basis: 'verified' }
    for (const [pattern, info] of PLATFORMS) if (pattern.test(host)) return info
    return { id: 'web', label: host, basis: 'verified' }
  } catch {
    return { id: 'web', label: 'Website', basis: 'verified' }
  }
}

export interface ExtractResult {
  data?: SourceData
  error?: string
  credits: number
}

/** Read one portfolio page into the common shape. */
export async function extractPage(url: string): Promise<ExtractResult> {
  const result = await scrape(url, { json: { schema: SCHEMA, instructions: INSTRUCTIONS } })
  if (!result.ok || !result.json) return { error: result.error ?? 'NO_CONTENT', credits: result.credits }
  const data = toSourceData(result.json)
  // A login wall or an empty app shell extracts to nothing.
  const empty =
    !data.workItems.length && !data.tools.length && !data.education.length && !data.experience.length && !data.headline
  return empty ? { error: 'NO_PROFILE_CONTENT', credits: result.credits } : { data, credits: result.credits }
}
