// Shared data model: what is collected about an applicant, the signals derived from it and
// the organiser's settings. Everything here is plain JSON so it can be stored in a file and
// scored again in the browser.

export const FIELD_IDS = [
  'semiconductors',
  'photonics',
  'quantum',
  'embedded',
  'space',
  'ai',
  'research',
  'business',
] as const
export type FieldId = (typeof FIELD_IDS)[number]

/**
 * How a fact is backed. "verified" means the work itself is visible in a portfolio (a
 * repository, a publication, a patent). "claimed" means the person only states it, as in a CV
 * or a LinkedIn profile.
 */
export type Basis = 'verified' | 'claimed'

/** One piece of work: a repository, publication, patent, design or project. */
export interface WorkItem {
  title: string
  description?: string | null
  tools: string[]
  year?: number | null
  /** First year, when the work spans several: a role held since 2019. */
  sinceYear?: number | null
  url?: string | null
  /** Stars, citations, likes: whatever the platform counts. */
  popularity?: number | null
  /** Language shares of a repository, 0 to 1. */
  languages?: Record<string, number>
  commits?: number | null
  fork?: boolean
  /**
   * How much the work is work in each field, 0 to 1, as judged by the model that read the page.
   * Missing when no model judged it; the fields then come from the words in the item.
   */
  fieldRelevance?: Partial<Record<FieldId, number>>
}

export interface EducationEntry {
  institution?: string | null
  degree?: string | null
  field?: string | null
  endYear?: number | null
}

export interface ExperienceEntry {
  title?: string | null
  organization?: string | null
  startYear?: number | null
  /** Missing or null means the role is ongoing. */
  endYear?: number | null
}

export interface SourceCounts {
  workItems?: number | null
  contributionsLastYear?: number | null
  activeDaysLastYear?: number | null
  followers?: number | null
  publications?: number | null
  citations?: number | null
  hIndex?: number | null
  patents?: number | null
  /** Earliest year with visible activity on the platform. */
  activeSinceYear?: number | null
}

/** Everything read from one link (or from the CV). */
export interface SourceData {
  personName?: string | null
  headline?: string | null
  organization?: string | null
  location?: string | null
  workItems: WorkItem[]
  /** Tools named on the page outside individual work items. */
  tools: string[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  counts: SourceCounts
  commitMessages: string[]
}

export interface Source {
  url: string
  platform: string
  basis: Basis
  status: 'ok' | 'failed'
  error?: string
  /** Pages fetched and Context.dev credits used for this source. */
  pages: number
  credits: number
  fetchedAt: string
  data?: SourceData
  /** Original CV conversion, retained on the server for review and re-parsing. */
  markdown?: string
}

export interface ToolSignal {
  tool: string
  fields: FieldId[]
  /** Work items in a portfolio that use the tool. */
  verifiedItems: number
  /** Stated in a CV or profile. */
  claimed: boolean
  /**
   * How strongly statements tie the tool to actual roles or projects: 0.6 for a role on a
   * public profile, 0.3 for a CV, 0 when the tool is only listed.
   */
  statedWeight: number
  /** Largest share of the person's public code written in it, 0 to 1 (0 when unknown). */
  share: number
  /** Years between the first and the last dated work item using the tool. */
  years: number
  /** Depth of evidence, 0 to 1. */
  strength: number
}

export interface Signals {
  tools: ToolSignal[]
  /** How much of the person's evidence concerns each field, 0 to 1. */
  relevance: Record<FieldId, number>
  /** Work items that are evidence for each field, by how they are backed. */
  fieldItems: Record<FieldId, { verified: number; claimed: number }>
  portfolio: {
    items: number
    /** Verified work in total, using the totals a profile states when it lists only a part. */
    verifiedItems: number
    /** Verified work items that were actually read. */
    listedVerified: number
    claimedItems: number
    popularity: number
    /** Largest audience on any of the person's profiles. */
    followers: number
    platforms: number
  }
  activity: {
    contributionsLastYear: number
    activeDaysLastYear: number
    commitMessages: number
    /** 0 to 1, null when no commit messages were seen. */
    commitQuality: number | null
    lastActiveYear: number | null
    activeSinceYear: number | null
  }
  research: { publications: number; citations: number; hIndex: number; patents: number }
  experience: { years: number; basis: Basis | 'activity' | null }
  education: { level: number; label: string; field: string | null; basis: Basis } | null
}

export interface Applicant {
  id: string
  /** Shown instead of the person's name. */
  alias: string
  declaredFields: FieldId[]
  links: string[]
  hasCv: boolean
  sources: Source[]
  signals: Signals
  createdAt: string
}

/** A participating company and the fields it recruits for. */
export interface Company {
  name: string
  url: string
  status: 'ok' | 'failed'
  summary?: string | null
  /** Share of the company's hiring interest per field; sums to 1 when any field was found. */
  fields: Partial<Record<FieldId, number>>
  soughtSkills: string[]
}

/** Why an applicant is on the organiser's priority list: a reach that large is shown first. */
export interface Priority {
  githubStars: number
  /** Followers or subscribers per channel that has a threshold, e.g. `{ youtube: 580000 }`. */
  followers: Record<string, number>
  /** For the card, e.g. "11k GitHub stars". */
  reasons: string[]
}

/** One participating company an applicant fits, with what they share. */
export interface CompanyMatch {
  name: string
  /** 0 to 1. */
  fit: number
  /** Skills the company looks for that the applicant has, at most three. */
  shared: string[]
}

export interface CompanyFit {
  /** The slider part, 0 to 1: how well the applicant fits the companies overall. */
  part: number
  /** The best matches, at most five. */
  matches: CompanyMatch[]
  matchCount: number
}

export const SLIDER_IDS = ['experience', 'portfolio', 'toolBreadth', 'toolDepth', 'education', 'companyFit'] as const
export type SliderId = (typeof SLIDER_IDS)[number]

export interface Settings {
  /** Organiser's sliders, 0 to 100. */
  weights: Record<SliderId, number>
  /** Tool the depth slider looks at; null means each applicant's strongest tool in the field. */
  focusTool: string | null
  /** How many applicants to suggest. */
  count: number
}
