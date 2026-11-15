import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { ALL_SKILLS, SKILLS, questionnaire, type Question } from '../lib/data'
import { useStore } from '../lib/store'
import { Btn, cx } from '../ui'

function Slider({
  q,
  value,
  onChange,
}: {
  q: Extract<Question, { type: 'slider' }>
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1 font-display text-lg font-bold">{q.prompt}</div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={q.prompt}
        onChange={(e) => onChange(+e.target.value)}
        style={{ ['--p' as string]: `${value}%` }}
      />
      <div className="flex justify-between text-xs font-medium text-mute">
        <span>{q.left}</span>
        <span className="text-right">{q.right}</span>
      </div>
    </div>
  )
}

function Checks({
  options,
  selected,
  max,
  onChange,
}: {
  options: string[]
  selected: string[]
  max?: number
  onChange: (v: string[]) => void
}) {
  const toggle = (o: string) => {
    if (selected.includes(o)) return onChange(selected.filter((x) => x !== o))
    if (max && selected.length >= max) return onChange([...selected.slice(1), o])
    onChange([...selected, o])
  }
  return (
    <div className="grid gap-2">
      {options.map((o) => {
        const on = selected.includes(o)
        return (
          <button
            key={o}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => toggle(o)}
            className={cx(
              'flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-left font-medium transition active:scale-[.985]',
              on ? 'border-forest bg-forest text-white' : 'border-line bg-card',
            )}
          >
            <span
              className={cx(
                'grid size-6 shrink-0 place-items-center rounded-lg border-2',
                on ? 'border-lime bg-lime text-forest' : 'border-line',
              )}
            >
              {on && <Check size={16} strokeWidth={3} />}
            </span>
            {o}
          </button>
        )
      })}
    </div>
  )
}

export function Questionnaire() {
  const s = useStore()
  const steps = questionnaire(s.r)
  const i = Math.min(s.step[s.r], steps.length - 1)
  const step = steps[i]
  const profile = s.r === 'talent' ? s.talent : s.company
  const setSkills = (v: string[]) => (s.r === 'talent' ? s.setTalent({ skills: v }) : s.setCompany({ skills: v }))
  const setStep = (n: number) => {
    s.patch({ step: { ...s.step, [s.r]: n } })
    window.scrollTo(0, 0)
  }
  const get = (q: Question) =>
    q.type === 'slider'
      ? ((s.answers[s.r][q.id] as number) ?? 50)
      : q.type === 'skills'
        ? profile.skills
        : ((s.answers[s.r][q.id] as string[]) ?? [])
  const valid = step.questions.every(
    (q) =>
      q.type === 'slider' ||
      (get(q) as string[]).length > 0 ||
      q.id === 'growth' ||
      q.id === 'process' ||
      q.id === 'benefits',
  )
  const last = i === steps.length - 1
  const next = () => {
    if (!last) return setStep(i + 1)
    s.patch({ done: { ...s.done, [s.r]: true }, step: { ...s.step, [s.r]: 0 } })
    s.go({ name: 'results' }, true)
  }
  const pool = profile.field ? SKILLS[profile.field] : ALL_SKILLS
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper">
      <div className="sticky top-0 z-20 bg-paper/95 px-4 pb-3 pt-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            aria-label="Close"
            onClick={s.back}
            className="grid size-10 place-items-center rounded-full active:bg-ink/10"
          >
            <X size={22} />
          </button>
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={i + 1}
          >
            <div
              className="h-full rounded-full bg-forest transition-all duration-500"
              style={{ width: `${((i + 1) / steps.length) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-sm font-medium text-mute">
            {i + 1}/{steps.length}
          </span>
        </div>
      </div>
      <div key={i} className="rise flex-1 px-5 pb-32 pt-4">
        <div className="text-xs font-bold uppercase tracking-wider text-mute">
          {s.r === 'company' ? 'Company profile' : 'Your profile'}
        </div>
        <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight">{step.title}</h1>
        <p className="mb-6 mt-2 text-mute">{step.intro}</p>
        <div className="space-y-7">
          {step.questions.map((q) => (
            <div key={q.id}>
              {q.type === 'slider' ? (
                <Slider q={q} value={get(q) as number} onChange={(v) => s.setAnswer(q.id, v)} />
              ) : (
                <>
                  <div className="mb-3 font-display text-lg font-bold">
                    {q.prompt}
                    {q.hint && <span className="ml-2 text-sm font-normal text-mute">{q.hint}</span>}
                  </div>
                  {q.type === 'skills' ? (
                    <Checks options={pool} selected={profile.skills} onChange={setSkills} />
                  ) : (
                    <Checks
                      options={q.options}
                      selected={get(q) as string[]}
                      max={q.max}
                      onChange={(v) => s.setAnswer(q.id, v)}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-3 bg-gradient-to-t from-paper via-paper to-transparent px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-6">
        {i > 0 && (
          <button
            aria-label="Previous step"
            onClick={() => setStep(i - 1)}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-line bg-card"
          >
            <ArrowLeft />
          </button>
        )}
        <Btn disabled={!valid} onClick={next}>
          {last ? 'See my matches' : 'Continue'}
          <ArrowRight size={18} />
        </Btn>
      </div>
    </div>
  )
}
