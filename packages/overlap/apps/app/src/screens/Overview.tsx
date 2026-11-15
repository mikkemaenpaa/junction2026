import { ArrowUpRight, Eye } from 'lucide-react'
import { EVENTS } from '../lib/data'
import { eventFit, eventVisible, rankTalents } from '../lib/fit'
import { useStore } from '../lib/store'
import { Avatar, Card, Page, Ring, Tag, TopBar, hueOf } from '../ui'
import { QuizCta } from './Events'

const DAYS = [18, 24, 21, 33, 29, 41, 38, 35, 47, 52, 49, 61, 58, 72]

export function Overview() {
  const s = useStore()
  const boost = s.completed ? 1 : 0.55
  const data = DAYS.map((d) => Math.round(d * boost))
  const total = data.reduce((a, b) => a + b, 0),
    max = Math.max(...data)
  const last7 = data.slice(7).reduce((a, b) => a + b, 0),
    prev7 = data.slice(0, 7).reduce((a, b) => a + b, 0)
  const delta = Math.round(((last7 - prev7) / prev7) * 100)
  const talents = rankTalents(s.ctx).slice(0, 3)
  const events = EVENTS.filter((e) => eventVisible(s.ctx, e))
    .map((e) => ({ e, f: eventFit(s.ctx, e) }))
    .sort((a, b) => b.f.score - a.f.score)
    .slice(0, 3)
  return (
    <Page>
      <TopBar title={s.company.name || 'Company overview'} />
      <h1 className="mb-4 font-display text-3xl font-extrabold leading-tight">Company overview</h1>
      <Card className="rise !bg-forest !border-forest text-white">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Eye size={16} />
          Visits to your page, last 14 days
        </div>
        <div className="mt-1 flex items-end gap-3">
          <span className="font-display text-5xl font-extrabold">{total.toLocaleString()}</span>
          <Tag tone="lime">
            <ArrowUpRight size={12} />
            {delta}% vs prior week
          </Tag>
        </div>
        <div className="mt-5 flex h-24 items-end gap-1" aria-label="Daily visits">
          {data.map((d, i) => (
            <div
              key={i}
              className="grow flex-1 rounded-t-md"
              style={{
                height: `${(d / max) * 100}%`,
                background: i >= 7 ? '#d9f26b' : '#ffffff40',
                animationDelay: `${i * 30}ms`,
              }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/50">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </Card>
      {!s.completed && (
        <div className="mt-4">
          <QuizCta />
        </div>
      )}

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">Top talents for you</h2>
          <button className="text-sm font-medium text-forest underline" onClick={() => s.go({ name: 'results' })}>
            See all
          </button>
        </div>
        <div className="space-y-2">
          {talents.map(({ t, fit }) => (
            <Card key={t.id} className="flex items-center gap-3">
              <Avatar name={t.name} hue={hueOf(t.name)} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-bold">{t.name}</div>
                <div className="truncate text-xs text-mute">
                  {t.headline} · {t.years} yrs
                </div>
              </div>
              <Ring value={fit.score} size={46} locked={!s.completed} />
            </Card>
          ))}
          {!talents.length && <Card className="text-sm text-mute">No talents match your filters.</Card>}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-display text-xl font-bold">Relevant events</h2>
        <div className="space-y-2">
          {events.map(({ e, f }) => (
            <Card key={e.id} onClick={() => s.go({ name: 'event', id: e.id })} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate font-display font-bold">{e.title}</div>
                <div className="truncate text-xs text-mute">
                  {e.category} · {e.date} · {e.talentIds.length} candidates
                </div>
              </div>
              <Ring value={f.score} size={46} locked={!s.completed} />
            </Card>
          ))}
        </div>
      </section>
    </Page>
  )
}
