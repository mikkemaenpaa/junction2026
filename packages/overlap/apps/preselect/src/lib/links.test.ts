import { describe, expect, it } from 'vite-plus/test'
import { MAX_LINKS, parseLinks } from './links.ts'

const urls = (text: string) => parseLinks(text).links.map((link) => link.url)
const reasons = (text: string) => parseLinks(text).rejected.map((r) => r.reason)

describe('links an applicant types', () => {
  it('completes a bare address', () => {
    expect(urls('example.org/work')).toEqual(['https://example.org/work'])
    expect(urls('http://Example.org/Work/')).toEqual(['https://example.org/Work'])
    expect(urls('www.example.org')).toEqual(['https://www.example.org'])
  })

  it('repairs LinkedIn profile addresses', () => {
    const profile = ['https://www.linkedin.com/in/ada-example']
    expect(urls('linkedin.com/ada-example')).toEqual(profile)
    expect(urls('https://fi.linkedin.com/in/Ada-Example/')).toEqual(profile)
    expect(urls('m.linkedin.com/in/ada-example/details/experience/')).toEqual(profile)
    expect(urls('https://www.linkedin.com/in/ada-example?originalSubdomain=fi&trk=public')).toEqual(profile)
    expect(urls('linkedin.com/mwlite/in/ada-example')).toEqual(profile)
    expect(parseLinks('linkedin.com/ada-example').links[0]!.fixed).toBe(true)
    expect(parseLinks('https://www.linkedin.com/in/ada-example/').links[0]!.fixed).toBe(false)
  })

  it('keeps LinkedIn posts, articles and company pages as they are', () => {
    expect(
      urls('https://www.linkedin.com/posts/ada-example_firmware-activity-7298722771000348673-CoH1?utm_source=share'),
    ).toEqual(['https://www.linkedin.com/posts/ada-example_firmware-activity-7298722771000348673-CoH1'])
    expect(urls('linkedin.com/pulse/embedded-firmware-ada-example-yszic')).toEqual([
      'https://www.linkedin.com/pulse/embedded-firmware-ada-example-yszic',
    ])
    expect(urls('linkedin.com/company/example-corp')).toEqual(['https://www.linkedin.com/company/example-corp'])
  })

  it('says why a LinkedIn address is not a profile', () => {
    expect(urls('linkedin.com/feed')).toEqual([])
    expect(reasons('linkedin.com/feed')[0]).toContain('linkedin.com/in/your-name')
    expect(reasons('linkedin.com/in/')[0]).toContain('no name')
    expect(reasons('https://lnkd.in/abc123')[0]).toContain('short link')
  })

  it('preserves chosen GitHub repositories and deduplicates files within the same repository', () => {
    expect(urls('github.com/adaexample/sensor-node/tree/main/src')).toEqual([
      'https://github.com/adaexample/sensor-node',
    ])
    expect(urls('https://github.com/adaexample?tab=repositories')).toEqual(['https://github.com/adaexample'])
    expect(urls('github.com/adaexample github.com/adaexample/notes https://www.github.com/AdaExample/')).toEqual([
      'https://github.com/adaexample',
      'https://github.com/adaexample/notes',
    ])
    expect(urls('github.com/AdaExample/Notes.git github.com/adaexample/notes/blob/main/README.md')).toEqual([
      'https://github.com/adaexample/notes',
    ])
    expect(urls('adaexample.github.io/portfolio')).toEqual(['https://adaexample.github.io/portfolio'])
    expect(reasons('github.com/topics/verilog')).toHaveLength(1)
  })

  it('understands "site: handle" and a bare ORCID iD', () => {
    expect(urls('github: adaexample, linkedin: ada-example')).toEqual([
      'https://github.com/adaexample',
      'https://www.linkedin.com/in/ada-example',
    ])
    expect(urls('GitHub = @adaexample')).toEqual(['https://github.com/adaexample'])
    expect(urls('my github: github.com/adaexample')).toEqual(['https://github.com/adaexample'])
    expect(urls('0000-0002-1825-009x')).toEqual(['https://orcid.org/0000-0002-1825-009X'])
    expect(urls('orcid: 0000-0002-1825-0097')).toEqual(['https://orcid.org/0000-0002-1825-0097'])
  })

  it('repairs the other platforms the form names', () => {
    expect(urls('twitter.com/adaexample/status/123')).toEqual(['https://x.com/adaexample'])
    expect(urls('instagram.com/ada.example?igshid=abc')).toEqual(['https://www.instagram.com/ada.example/'])
    expect(urls('tiktok.com/adaexample')).toEqual(['https://www.tiktok.com/@adaexample'])
    expect(urls('snapchat.com/adaexample')).toEqual(['https://www.snapchat.com/add/adaexample'])
    expect(urls('https://youtu.be/dQw4w9WgXcQ?si=abc')).toEqual(['https://www.youtube.com/watch?v=dQw4w9WgXcQ'])
    expect(urls('youtube.com/@adaexample/videos')).toEqual(['https://www.youtube.com/@adaexample'])
    expect(urls('kaggle.com/adaexample')).toEqual(['https://www.kaggle.com/adaexample/code'])
    expect(urls('https://scholar.google.fi/citations?user=AbCdEf&hl=fi&oi=ao')).toEqual([
      'https://scholar.google.com/citations?user=AbCdEf',
    ])
    expect(reasons('scholar.google.com/scholar?q=ada')[0]).toContain('not a profile')
  })

  it('finds links inside a sentence and ignores the words around them', () => {
    expect(
      urls('Hi! My work is at (https://example.org/portfolio), see also [my code](github.com/adaexample).'),
    ).toEqual(['https://example.org/portfolio', 'https://github.com/adaexample'])
    expect(parseLinks('I am a firmware engineer with a cv.pdf')).toEqual({ links: [], rejected: [] })
  })

  it('removes tracking parameters and keeps the ones that matter', () => {
    expect(urls('https://example.org/p?id=7&utm_source=x&fbclid=y#top')).toEqual(['https://example.org/p?id=7'])
  })

  it('refuses what cannot be a link to work, with a reason', () => {
    expect(reasons('ada@example.org')).toEqual(['An email address, not a link to your work.'])
    expect(reasons('mailto:ada@example.org')).toEqual(['An email address, not a link to your work.'])
    expect(reasons('@adaexample')[0]).toContain('github.com/adaexample')
    expect(reasons('javascript:alert(1)')).toEqual(['Only web addresses (http or https) can be read.'])
    expect(reasons('http://192.168.1.10/cv')).toHaveLength(1)
    expect(reasons('http://localhost:3000')).toEqual([])
    expect(reasons('intranet.local/cv')).toHaveLength(1)
    expect(urls('ada@example.org javascript:alert(1) @adaexample 192.168.1.10 intranet.local/cv')).toEqual([])
  })

  it('reads at most the first links', () => {
    const many = Array.from({ length: MAX_LINKS + 2 }, (_, i) => `example.org/${i}`).join(' ')
    expect(urls(many)).toHaveLength(MAX_LINKS)
    expect(reasons(many)).toHaveLength(2)
  })
})
