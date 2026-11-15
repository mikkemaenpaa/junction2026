import { LogOut, Repeat, RotateCcw } from 'lucide-react'
import { ALL_SKILLS, AVAILABILITY, COMPANIES, EVENTS, FIELDS, LANGUAGES, PERMITS, SKILLS, TALENTS } from '../lib/data'
import { eventVisible, passCompany, passTalent } from '../lib/fit'
import { useStore } from '../lib/store'
import { Chip, Page, TopBar, cx } from '../ui'

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="mb-6">
    <h2 className="font-display text-lg font-bold">{title}</h2>
    {hint && <p className="mb-2 text-xs text-mute">{hint}</p>}
    <div className="mt-2 flex flex-wrap gap-2">{children}</div>
  </section>
)
const toggle = (a: string[], v: string) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v])

export function SettingsScreen() {
  const s = useStore()
  const isT = s.r === 'talent'
  const p = isT ? s.talent : s.company
  const set = (x: object) => (isT ? s.setTalent(x) : s.setCompany(x))
  const nC = COMPANIES.filter((c) => passCompany({ ...s.ctx, filters: true }, c)).length
  const nT = TALENTS.filter((t) => passTalent({ ...s.ctx, filters: true }, t)).length
  const nE = EVENTS.filter((e) => eventVisible({ ...s.ctx, filters: true }, e)).length
  return (
    <Page>
      <TopBar title="Profile & filters" />
      <div className="rise mb-6 rounded-3xl bg-forest p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-lg font-bold">Use as filters</div>
            <p className="text-sm text-white/70">
              {s.filters
                ? isT
                  ? `${nC} companies · ${nE} events match`
                  : `${nT} talents · ${nE} events match`
                : 'Showing everything'}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={s.filters}
            aria-label="Use settings as filters"
            onClick={() => s.patch({ filters: !s.filters })}
            className={cx('relative h-8 w-14 rounded-full transition', s.filters ? 'bg-lime' : 'bg-white/25')}
          >
            <span
              className={cx(
                'absolute top-1 size-6 rounded-full bg-forest transition-all',
                s.filters ? 'left-7' : 'left-1',
                !s.filters && 'bg-white',
              )}
            />
          </button>
        </div>
      </div>

      <section className="mb-6">
        <label className="font-display text-lg font-bold" htmlFor="nm">
          {isT ? 'Your name' : 'Company name'}
        </label>
        <input
          id="nm"
          value={p.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder={isT ? 'Alex Morgan' : 'Acme Inc.'}
          className="mt-2 h-14 w-full rounded-2xl border border-line bg-card px-4 outline-none focus:border-forest"
        />
        <p className="mt-1 text-xs text-mute">{s.email}</p>
      </section>

      <Section title="Field" hint={isT ? 'Show companies and events in this field.' : 'The field you are hiring in.'}>
        {FIELDS.map((f) => (
          <Chip key={f} on={p.field === f} onClick={() => set({ field: p.field === f ? '' : f })}>
            {f}
          </Chip>
        ))}
      </Section>
      <Section
        title={isT ? 'Languages' : 'Languages required'}
        hint={isT ? 'Companies must use at least one of these.' : 'Candidates must speak all of these.'}
      >
        {LANGUAGES.map((l) => (
          <Chip key={l} on={p.languages.includes(l)} onClick={() => set({ languages: toggle(p.languages, l) })}>
            {l}
          </Chip>
        ))}
      </Section>

      {isT ? (
        <>
          <section className="mb-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-bold">Years of experience</h2>
              <span className="font-display text-xl font-extrabold">
                {s.talent.years === 10 ? '10+' : s.talent.years}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={s.talent.years}
              aria-label="Years of experience"
              onChange={(e) => s.setTalent({ years: +e.target.value })}
              style={{ ['--p' as string]: `${s.talent.years * 10}%` }}
            />
          </section>
          <Section title="Availability">
            {AVAILABILITY.map((a) => (
              <Chip key={a} on={s.talent.availability === a} onClick={() => s.setTalent({ availability: a })}>
                {a}
              </Chip>
            ))}
          </Section>
          <Section title="Work permit" hint="Companies that cannot sponsor are hidden if you need sponsorship.">
            {PERMITS.map((a) => (
              <Chip key={a} on={s.talent.permit === a} onClick={() => s.setTalent({ permit: a })}>
                {a}
              </Chip>
            ))}
          </Section>
        </>
      ) : (
        <Section title="Skills required" hint="Candidates need at least one of these.">
          {(s.company.field ? SKILLS[s.company.field] : ALL_SKILLS).map((k) => (
            <Chip
              key={k}
              on={s.company.skills.includes(k)}
              onClick={() => s.setCompany({ skills: toggle(s.company.skills, k) })}
            >
              {k}
            </Chip>
          ))}
        </Section>
      )}

      <div className="space-y-2 border-t border-line pt-5">
        <button
          onClick={() => {
            s.patch({ done: { ...s.done, [s.r]: false }, step: { ...s.step, [s.r]: 0 } })
            s.go({ name: 'quiz' })
          }}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 font-medium active:bg-ink/6"
        >
          <RotateCcw size={18} />
          Retake questionnaire
        </button>
        <button
          onClick={() => {
            s.patch({ role: isT ? 'company' : 'talent' })
            s.go({ name: 'home' })
          }}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 font-medium active:bg-ink/6"
        >
          <Repeat size={18} />
          Switch to {isT ? 'company' : 'talent'} side
        </button>
        <button
          onClick={s.signOut}
          className="flex h-12 w-full items-center gap-3 rounded-2xl px-3 font-medium text-[#b4391b] active:bg-coral/10"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </Page>
  )
}
