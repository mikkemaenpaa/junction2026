// The organiser's view: a few broad sliders, the number of applicants to suggest, and the
// suggested applicants as cards. Scoring runs in the browser, so every change shows at once.
import { useMemo, useState } from 'react'
import { DEFAULT_SETTINGS, fieldShares, select } from '../lib/scoring.ts'
import { FIELDS, FIELD_BY_ID, TOOLS } from '../lib/taxonomy.ts'
import { traits } from '../lib/traits.ts'
import { SLIDER_IDS } from '../lib/types.ts'
import type { Company, FieldId, Settings, SliderId } from '../lib/types.ts'
import type { ApplicantView } from '../lib/view.ts'

const SLIDERS: Record<SliderId, { label: string; hint: string }> = {
  experience: { label: 'Work experience', hint: 'Years of work, or of public activity when no work history is given.' },
  portfolio: {
    label: 'Size of portfolio',
    hint: 'How much work in the field can be seen, and how active and recent it is.',
  },
  toolBreadth: { label: 'Range of skills', hint: "How many of the field's tools and methods the applicant uses." },
  toolDepth: { label: 'Depth in one skill', hint: 'How strong the evidence is for a single tool or method.' },
  education: { label: 'Education', hint: 'Level of the degree and whether it is in the field.' },
  companyFit: {
    label: 'Match with companies',
    hint: 'How well the fields and skills fit what the participating companies look for.',
  },
}

const COUNTS = [20, 500, 1000]

// Skills grouped under the first field they belong to, for the depth picker.
const SKILL_GROUPS = FIELDS.map((field) => ({
  field,
  skills: TOOLS.filter((t) => t.fields[0] === field.id)
    .map((t) => t.name)
    .sort((a, b) => a.localeCompare(b)),
}))

function Slider(props: { id: SliderId; value: number; onChange: (value: number) => void; children?: React.ReactNode }) {
  const { label, hint } = SLIDERS[props.id]
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={`slider-${props.id}`} className="text-sm font-semibold">
          {label}
        </label>
        <span className="text-xs tabular-nums text-muted">{props.value === 0 ? 'ignored' : props.value}</span>
      </div>
      <input
        id={`slider-${props.id}`}
        type="range"
        min={0}
        max={100}
        step={5}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-1 w-full accent-accent"
      />
      <p className="text-xs text-muted">{hint}</p>
      {props.children}
    </div>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  )
}

export default function Organizer({ applicants, companies }: { applicants: ApplicantView[]; companies: Company[] }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [shown, setShown] = useState<FieldId | 'all'>('all')

  const classified = useMemo(() => companies.filter((c) => c.status === 'ok'), [companies])
  const shares = useMemo(() => fieldShares(classified), [classified])
  const selection = useMemo(() => select(applicants, settings, shares), [applicants, settings, shares])
  const readable = applicants.filter((a) => a.sources.some((s) => s.ok)).length

  const setWeight = (id: SliderId, value: number) =>
    setSettings((s) => ({ ...s, weights: { ...s.weights, [id]: value } }))
  const setCount = (count: number) =>
    setSettings((s) => ({ ...s, count: Math.max(1, Math.min(100_000, Math.round(count) || 1)) }))

  const perField = (field: FieldId) => selection.suggestions.filter((s) => s.field === field).length
  const visible = selection.suggestions.filter((s) => shown === 'all' || s.field === shown)

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start">
      <aside className="flex w-full shrink-0 flex-col gap-6 rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-6 lg:w-80">
        <section>
          <h2 className="text-sm font-semibold">How many applicants should we suggest?</h2>
          <div className="mt-2 flex gap-2">
            {COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setCount(count)}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium ${settings.count === count ? 'border-accent bg-accent text-white' : 'border-line bg-surface hover:border-accent'}`}
              >
                {count}
              </button>
            ))}
            <input
              type="number"
              min={1}
              aria-label="Other number of applicants"
              value={settings.count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-20 rounded-lg border border-line px-2 py-1.5 text-sm tabular-nums"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-semibold">What matters most?</h2>
            <p className="text-xs text-muted">
              Move a slider to the right to make it count more. The details behind each one are worked out for you.
            </p>
          </div>
          {SLIDER_IDS.map((id) => (
            <Slider key={id} id={id} value={settings.weights[id]} onChange={(value) => setWeight(id, value)}>
              {id === 'toolDepth' && (
                <select
                  aria-label="Skill to look at"
                  value={settings.focusTool ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, focusTool: e.target.value || null }))}
                  className="mt-2 w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-sm"
                >
                  <option value="">Each applicant's strongest skill</option>
                  {SKILL_GROUPS.map(({ field, skills }) => (
                    <optgroup key={field.id} label={field.short}>
                      {skills.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </Slider>
          ))}
          <button
            type="button"
            onClick={() => setSettings((s) => ({ ...DEFAULT_SETTINGS, count: s.count }))}
            className="self-start text-xs font-medium text-accent hover:underline"
          >
            Reset sliders
          </button>
        </section>

        <section>
          <h2 className="text-sm font-semibold">Places per field</h2>
          <p className="text-xs text-muted">
            {classified.length
              ? `Split by the fields of the ${classified.length} participating companies. A field with too few suitable applicants passes its places on.`
              : 'No company data yet: every field gets an equal share.'}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {FIELDS.map((field) => (
              <li key={field.id} className="text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{field.short}</span>
                  <span className="tabular-nums text-muted">
                    {perField(field.id)} of {selection.pool[field.id]} · {Math.round(shares[field.id] * 100)}%
                  </span>
                </div>
                <Bar value={shares[field.id] / Math.max(...FIELDS.map((f) => shares[f.id]))} />
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Suggested applicants</h1>
            <p className="text-sm text-muted">
              {selection.suggestions.length} suggested of {readable} applicants with readable portfolios. This is a
              suggestion: you decide who gets a place.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-verified" /> seen in a portfolio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-claimed" /> stated by the applicant
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(['all', ...FIELDS.map((f) => f.id)] as const).map((id) => {
            const count = id === 'all' ? selection.suggestions.length : perField(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => setShown(id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${shown === id ? 'border-accent bg-accent-soft text-accent' : 'border-line bg-surface text-muted hover:border-accent'}`}
              >
                {id === 'all' ? 'All fields' : FIELD_BY_ID[id].short} · {count}
              </button>
            )
          })}
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
            {applicants.length
              ? 'No applicant scores above zero with these settings.'
              : 'No applicants yet. Applications sent through the form appear here.'}
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {visible.map((s, index) => (
              <li key={s.applicant.id} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs tabular-nums text-muted">#{index + 1}</p>
                    <h3 className="font-semibold">{s.applicant.alias}</h3>
                    {s.applicant.priority && (
                      <p className="text-xs font-semibold text-verified">
                        Priority: {s.applicant.priority.reasons.join(' · ')}
                      </p>
                    )}
                    <p className="text-xs text-accent">
                      {FIELD_BY_ID[s.field].name}
                      {s.overflow && <span className="text-muted"> · place passed on from another field</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tabular-nums leading-none">{s.score.toFixed(0)}</p>
                    <p className="text-[11px] text-muted">fit, 0 to 100</p>
                  </div>
                </div>

                <ul className="flex flex-col gap-1.5 text-sm">
                  {traits(s.applicant.signals, s.field, settings, s.parts, s.applicant.companies).map((trait) => (
                    <li key={trait.text} className="flex gap-2">
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${trait.basis === 'verified' ? 'bg-verified' : 'bg-claimed'}`}
                      />
                      <span>{trait.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto grid grid-cols-6 gap-2 pt-1">
                  {SLIDER_IDS.map((id) => (
                    <div key={id} title={`${SLIDERS[id].label}: ${Math.round(s.parts[id] * 100)} of 100`}>
                      <Bar value={s.parts[id]} />
                      <p className="mt-1 truncate text-[10px] text-muted">{SLIDERS[id].label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
                  {s.applicant.sources.map((source) =>
                    source.ok ? (
                      <a
                        key={source.url ?? source.label}
                        href={source.url ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${source.basis === 'verified' ? 'bg-verified-soft text-verified' : 'bg-claimed-soft text-claimed'}`}
                      >
                        {source.label}
                      </a>
                    ) : (
                      <span
                        key={source.url ?? source.label}
                        title={source.error}
                        className="rounded-md bg-line px-2 py-0.5 text-xs text-muted line-through"
                      >
                        {source.label}
                      </span>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
