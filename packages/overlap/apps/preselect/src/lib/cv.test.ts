import { describe, expect, it } from 'vite-plus/test'
import { parseCv } from './cv.ts'

describe('CV extraction regressions', () => {
  it.each(['01/2020 – 06/2023', '1.2020 - 6.2023', '2020-01 — 2023-06', 'Jan 2020 to June 2023'])(
    'reads the whole date range %s without making the role ongoing',
    (range) => {
      const cv = parseCv(`Experience\nEngineer, Example Oy ${range}`)
      expect(cv.experience).toEqual([{ title: 'Engineer', organization: 'Example Oy', startYear: 2020, endYear: 2023 }])
    },
  )

  it.each(['present', 'nykyhetki', 'nykyinen', 'jatkuu'])('accepts an explicit ongoing end date: %s', (end) => {
    expect(parseCv(`Työkokemus\nEngineer 2020 – ${end}`).experience[0]).toMatchObject({
      startYear: 2020,
      endYear: null,
    })
  })

  it.each(['2020 –', '2020 – unknown', '2023 – 2020', '13/2020 – 06/2023'])(
    'does not invent work history from an incomplete or invalid date range: %s',
    (range) => {
      expect(parseCv(`Experience\nEngineer ${range}`).experience).toEqual([])
    },
  )

  it('keeps education dates out of work history and associates adjacent degree details', () => {
    const cv = parseCv('Koulutus\nAalto-yliopisto 2018–2023\nDiplomi-insinööri, tietotekniikka')
    expect(cv.experience).toEqual([])
    expect(cv.education).toEqual([
      {
        degree: 'Diplomi-insinööri, tietotekniikka',
        field: 'tietotekniikka',
        institution: 'Aalto-yliopisto 2018–2023',
        endYear: 2023,
      },
    ])
  })

  it('does not borrow education dates from another section', () => {
    const cv = parseCv('Education\nM.Sc. in Physics\nExperience\nEngineer 2020–2023')
    expect(cv.education[0]?.endYear).toBeNull()
    expect(cv.experience).toHaveLength(1)
  })

  it.each(['Projects', 'PROJECTS', '**Projects**', '## Projects', 'Projektit:'])(
    'recognizes %s and does not turn a dated project into employment',
    (heading) => {
      const cv = parseCv(`${heading}\nSatellite telemetry in Python 2020–2023`)
      expect(cv.experience).toEqual([])
      expect(cv.workItems).toHaveLength(1)
      expect(cv.workItems[0]?.title).toContain('Satellite telemetry')
      expect(cv.workItems[0]?.tools).toContain('Python')
    },
  )

  it('keeps role descriptions attached to their role, including bold role titles', () => {
    const cv = parseCv(`Experience
**Engineer, Example Oy 2020–2023**
Led a team of 8 and reduced processing time by 40% using Python.
**Developer, Other Oy 2018–2020**
Built Rust firmware.
Skills
KiCad`)
    expect(cv.experience).toHaveLength(2)
    expect(cv.workItems).toHaveLength(2)
    expect(cv.workItems[0]?.description).toContain('40%')
    expect(cv.workItems[0]?.tools).toContain('Python')
    expect(cv.workItems[0]?.description).not.toContain('Rust')
    expect(cv.workItems[1]?.tools).toContain('Rust')
    expect(cv.workItems[1]?.description).not.toContain('KiCad')
  })

  it('keeps a role title on the line before its dates', () => {
    const cv = parseCv('Experience\nFirmware engineer, Example Oy\n2020–2023\nBuilt Rust firmware.')
    expect(cv.experience[0]).toMatchObject({ title: 'Firmware engineer', organization: 'Example Oy' })
    expect(cv.workItems[0]?.description).toContain('Built Rust firmware.')
  })

  it('does not silently truncate project lists or long descriptions', () => {
    const items = Array.from({ length: 30 }, (_, i) => `- Project ${i}: ${'Python telemetry '.repeat(12)}`)
    const cv = parseCv(`Projects\n${items.join('\n')}`)
    expect(cv.workItems).toHaveLength(30)
    expect(cv.workItems[29]?.title).toBe(items[29]!.slice(2).trim())
  })

  it('ignores page markers, table separators and section headings as profile text', () => {
    const cv = parseCv('<!-- page 1 -->\nExperience\n| --- | --- |\nEngineer 2020–2023')
    expect(cv.headline).toBe('Engineer 2020–2023')
    expect(cv.experience).toHaveLength(1)
  })
})
