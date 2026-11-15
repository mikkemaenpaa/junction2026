import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { EVENTS } from '../lib/data'
import { eventFit, eventVisible, fitLabel, rankCompanies, rankTalents } from '../lib/fit'
import { useStore } from '../lib/store'
import { Avatar, Card, Chip, DimBars, Page, Ring, Tag, TopBar, cx, hueOf } from '../ui'
import { QuizCta } from './Events'

export function Results() {
  const s = useStore()
  const [tab, setTab] = useState<'companies' | 'events'>('companies')
  const [open, setOpen] = useState<string | null>(null)
  const events = EVENTS.filter((e) => eventVisible(s.ctx, e))
    .map((e) => ({ e, f: eventFit(s.ctx, e) }))
    .sort((a, b) => b.f.score - a.f.score)
  const toggle = (id: string) => setOpen(open === id ? null : id)
  return (
    <Page>
      <TopBar title="Your matches" />
      <h1 className="mb-4 font-display text-3xl font-extrabold leading-tight">
        {s.r === 'talent' ? 'Where you fit best' : 'Your best-fitting candidates'}
      </h1>
      {!s.completed ? (
        <QuizCta />
      ) : (
        <>
          {s.r === 'talent' && (
            <div className="mb-4 flex gap-2">
              <Chip on={tab === 'companies'} onClick={() => setTab('companies')}>
                Companies
              </Chip>
              <Chip on={tab === 'events'} onClick={() => setTab('events')}>
                Events
              </Chip>
            </div>
          )}
          {s.filters && <p className="mb-3 text-xs text-mute">Filtered by your profile settings.</p>}
          <div className="space-y-2">
            {s.r === 'talent' &&
              tab === 'companies' &&
              rankCompanies(s.ctx).map(({ c, fit }, i) => (
                <Card key={c.id} onClick={() => toggle(c.id)}>
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-display font-bold text-mute">{i + 1}</span>
                    <Avatar name={c.name} hue={c.hue} square />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display font-bold">{c.name}</div>
                      <div className="truncate text-xs text-mute">{c.tagline}</div>
                    </div>
                    <Ring value={fit.score} size={48} />
                    <ChevronDown size={16} className={cx('text-mute transition', open === c.id && 'rotate-180')} />
                  </div>
                  {open === c.id && (
                    <div className="mt-4 border-t border-line pt-4">
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <Tag tone="lime">{fitLabel(fit.score)}</Tag>
                        <Tag>{c.field}</Tag>
                        <Tag>{c.city}</Tag>
                        <Tag>{c.size}</Tag>
                        {c.sponsors && <Tag>Visa sponsor</Tag>}
                      </div>
                      <DimBars dims={fit.dims} />
                    </div>
                  )}
                </Card>
              ))}
            {s.r === 'talent' &&
              tab === 'events' &&
              events.map(({ e, f }, i) => (
                <Card key={e.id} onClick={() => s.go({ name: 'event', id: e.id })} className="flex items-center gap-3">
                  <span className="w-5 text-center font-display font-bold text-mute">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display font-bold">{e.title}</div>
                    <div className="truncate text-xs text-mute">
                      {e.category} · {e.date}
                    </div>
                  </div>
                  <Ring value={f.score} size={48} />
                </Card>
              ))}
            {s.r === 'company' &&
              rankTalents(s.ctx).map(({ t, fit }, i) => (
                <Card key={t.id} onClick={() => toggle(t.id)}>
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-display font-bold text-mute">{i + 1}</span>
                    <Avatar name={t.name} hue={hueOf(t.name)} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display font-bold">{t.name}</div>
                      <div className="truncate text-xs text-mute">
                        {t.headline} · {t.years} yrs
                      </div>
                    </div>
                    <Ring value={fit.score} size={48} />
                    <ChevronDown size={16} className={cx('text-mute transition', open === t.id && 'rotate-180')} />
                  </div>
                  {open === t.id && (
                    <div className="mt-4 border-t border-line pt-4">
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <Tag tone="lime">{fitLabel(fit.score)}</Tag>
                        <Tag>{t.availability}</Tag>
                        {t.languages.map((l) => (
                          <Tag key={l}>{l}</Tag>
                        ))}
                      </div>
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {t.skills.map((k) => (
                          <Tag key={k} tone={s.company.skills.includes(k) ? 'lime' : 'plain'}>
                            {k}
                          </Tag>
                        ))}
                      </div>
                      <DimBars dims={fit.dims} />
                    </div>
                  )}
                </Card>
              ))}
            {((s.r === 'talent' && tab === 'companies' && !rankCompanies(s.ctx).length) ||
              (s.r === 'company' && !rankTalents(s.ctx).length)) && (
              <Card className="text-center">
                <p className="font-display text-lg font-bold">Nothing matches your filters</p>
                <p className="mt-1 text-sm text-mute">Relax your profile settings to see more results.</p>
              </Card>
            )}
          </div>
        </>
      )}
    </Page>
  )
}
