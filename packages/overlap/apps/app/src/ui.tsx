import type { ReactNode } from 'react'
import { ArrowLeft, BarChart3, CalendarDays, Settings, Sparkles, Trophy, Lock } from 'lucide-react'
import { useStore, type Route } from './lib/store'
import { DIMS, fitLabel, type Breakdown } from './lib/fit'

export const cx = (...a: (string | false | undefined | null)[]) => a.filter(Boolean).join(' ')

export function Ring({
  value,
  size = 56,
  locked,
  dark,
}: {
  value: number
  size?: number
  locked?: boolean
  dark?: boolean
}) {
  const r = size / 2 - 5,
    c = 2 * Math.PI * r
  const col = value >= 80 ? '#1f9d6b' : value >= 65 ? '#6aa84f' : value >= 50 ? '#e0a526' : '#e5654a'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? '#ffffff25' : '#e3ddd1'} strokeWidth="5" />
        {!locked && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={dark ? '#d9f26b' : col}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - value / 100)}
            style={{ transition: 'stroke-dashoffset .8s' }}
          />
        )}
      </svg>
      <div
        className={cx('absolute inset-0 grid place-items-center font-display font-bold', dark && 'text-white')}
        style={{ fontSize: size * 0.3 }}
      >
        {locked ? <Lock size={size * 0.3} className="text-mute" /> : value}
      </div>
    </div>
  )
}

export function Avatar({
  name,
  hue,
  size = 44,
  square,
}: {
  name: string
  hue: number
  size?: number
  square?: boolean
}) {
  const ini = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <div
      className={cx('grid shrink-0 place-items-center font-display font-bold', square ? 'rounded-xl' : 'rounded-full')}
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} 55% 88%)`,
        color: `hsl(${hue} 60% 22%)`,
        fontSize: size * 0.36,
      }}
    >
      {ini}
    </div>
  )
}
export const hueOf = (s: string) => [...s].reduce((a, ch) => a + ch.charCodeAt(0) * 7, 0) % 360

export function Chip({
  on,
  children,
  onClick,
  small,
}: {
  on?: boolean
  children: ReactNode
  onClick?: () => void
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        'rounded-full border font-medium transition active:scale-95',
        small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
        on ? 'border-forest bg-forest text-white' : 'border-line bg-card text-ink',
        !onClick && 'pointer-events-none',
      )}
    >
      {children}
    </button>
  )
}
export const Tag = ({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: 'plain' | 'lime' | 'coral' | 'dark'
}) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
      tone === 'plain' && 'bg-ink/6 text-ink',
      tone === 'lime' && 'bg-lime text-forest',
      tone === 'coral' && 'bg-coral/15 text-[#b4391b]',
      tone === 'dark' && 'bg-white/15 text-white',
    )}
  >
    {children}
  </span>
)

export function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'lime' | 'ghost'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-6 font-display text-base font-bold transition active:scale-[.98] disabled:opacity-40',
        variant === 'primary' && 'bg-forest text-white',
        variant === 'lime' && 'bg-lime text-forest',
        variant === 'ghost' && 'border border-line bg-card text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const C = onClick ? 'button' : 'div'
  return (
    <C
      onClick={onClick}
      className={cx(
        'block w-full rounded-3xl border border-line bg-card p-4 text-left',
        onClick && 'transition active:scale-[.985]',
        className,
      )}
    >
      {children}
    </C>
  )
}

export function DimBars({ dims, highlight = true }: { dims: Breakdown; highlight?: boolean }) {
  const vals = DIMS.map((d) => dims[d]),
    hi = Math.max(...vals),
    lo = Math.min(...vals)
  return (
    <div className="space-y-3">
      {DIMS.map((d) => (
        <div key={d}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">{d}</span>
            <span className="text-mute">{dims[d]}%</span>
          </div>
          <div className="h-2 rounded-full bg-line">
            <div
              className={cx(
                'grow h-2 rounded-full',
                highlight && dims[d] === hi ? 'bg-[#1f9d6b]' : highlight && dims[d] === lo ? 'bg-coral' : 'bg-forest',
              )}
              style={{ width: `${dims[d]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
export { fitLabel }

export function TopBar({ title, back, right }: { title?: string; back?: boolean; right?: ReactNode }) {
  const s = useStore()
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-2 bg-paper/90 px-4 backdrop-blur">
      {back && (
        <button
          aria-label="Back"
          onClick={s.back}
          className="-ml-2 grid size-10 place-items-center rounded-full active:bg-ink/10"
        >
          <ArrowLeft size={22} />
        </button>
      )}
      <div className="flex-1 truncate font-display text-lg font-bold">{title}</div>
      {right}
    </div>
  )
}

export function Page({ children, nav = true, className }: { children: ReactNode; nav?: boolean; className?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper sm:border-x sm:border-line">
      <div className={cx('flex-1 px-4', nav ? 'pb-28' : 'pb-8', className)}>{children}</div>
      {nav && <TabBar />}
    </div>
  )
}

export function TabBar() {
  const s = useStore()
  const tabs: { r: Route; label: string; icon: ReactNode }[] = [
    { r: { name: 'home' }, label: 'Events', icon: <CalendarDays size={22} /> },
    { r: { name: 'results' }, label: 'Matches', icon: <Trophy size={22} /> },
    ...(s.r === 'company'
      ? [{ r: { name: 'overview' } as Route, label: 'Overview', icon: <BarChart3 size={22} /> }]
      : []),
    { r: { name: 'settings' }, label: 'Profile', icon: <Settings size={22} /> },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="flex rounded-full bg-forest p-1.5 shadow-xl shadow-forest/30">
        {tabs.map((t) => {
          const on = s.route.name === t.r.name || (t.r.name === 'home' && s.route.name === 'event')
          return (
            <button
              key={t.label}
              onClick={() => s.go(t.r)}
              className={cx(
                'flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[11px] font-medium transition',
                on ? 'bg-lime text-forest' : 'text-white/70',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export function Logo({ dark }: { dark?: boolean }) {
  return (
    <div
      className={cx(
        'flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight',
        dark ? 'text-white' : 'text-forest',
      )}
    >
      <span className="relative inline-block size-8">
        <span className="absolute left-0 top-0 size-5 rounded-full bg-lime ring-2 ring-forest" />
        <span className="absolute bottom-0 right-0 size-5 rounded-full bg-coral mix-blend-multiply" />
      </span>
      overlap
    </div>
  )
}
export const SparkTag = ({ children }: { children: ReactNode }) => (
  <Tag tone="lime">
    <Sparkles size={12} />
    {children}
  </Tag>
)
