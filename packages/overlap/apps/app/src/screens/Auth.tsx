import { useEffect, useState } from 'react'
import { ArrowRight, Briefcase, GraduationCap } from 'lucide-react'
import { DEMO_EMAIL, useStore } from '../lib/store'
import { Btn, Logo, cx } from '../ui'

export function Loading() {
  const s = useStore()
  // Without an email, the login. A visitor handed over by the landing page's /get-started has the
  // demo's (lib/handoff.ts), so goes on to the role choice or home.
  useEffect(() => {
    const t = setTimeout(
      () => s.go(!s.email ? { name: 'login' } : s.role ? { name: 'home' } : { name: 'role' }, true),
      1800,
    )
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="grid min-h-dvh place-items-center bg-forest">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <Logo dark />
        </div>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/15">
          <div className="grow h-full w-full rounded-full bg-lime" style={{ animationDuration: '1.6s' }} />
        </div>
        <p className="text-sm text-white/60">Finding your overlap</p>
      </div>
    </div>
  )
}

export function Login() {
  const s = useStore()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const ok = /\S+@\S+\.\S+/.test(email) && pw.length >= 6
  const submit = () => {
    s.signIn(email)
    s.go({ name: 'role' }, true)
  }
  const field = 'h-14 w-full rounded-2xl border border-line bg-card px-4 text-base outline-none focus:border-forest'
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper">
      <div className="relative overflow-hidden rounded-b-[40px] bg-forest px-6 pb-12 pt-10 text-white">
        <div className="absolute -right-10 -top-10 size-44 rounded-full bg-lime/90" />
        <div className="absolute -right-2 top-16 size-32 rounded-full bg-coral mix-blend-screen opacity-80" />
        <Logo dark />
        <h1 className="rise mt-16 max-w-[14rem] font-display text-4xl font-extrabold leading-[1.05]">
          Meet the people and teams you fit.
        </h1>
        <p className="mt-3 max-w-xs text-white/70">See your fit rating before you walk into the room.</p>
      </div>
      <form
        className="flex flex-1 flex-col gap-3 px-6 py-8"
        onSubmit={(e) => {
          e.preventDefault()
          ok && submit()
        }}
      >
        <div className="mb-2 flex rounded-full bg-ink/6 p-1">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cx('flex-1 rounded-full py-2 text-sm font-medium', mode === m && 'bg-card shadow-sm')}
            >
              {m === 'in' ? 'Log in' : 'Create account'}
            </button>
          ))}
        </div>
        <input
          className={field}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={field}
          type="password"
          autoComplete="current-password"
          placeholder="Password (6+ characters)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <Btn type="submit" disabled={!ok}>
          {mode === 'in' ? 'Log in' : 'Create account'}
          <ArrowRight size={18} />
        </Btn>
        <div className="my-1 flex items-center gap-3 text-xs text-mute">
          <div className="h-px flex-1 bg-line" />
          or
          <div className="h-px flex-1 bg-line" />
        </div>
        <Btn
          variant="ghost"
          onClick={() => {
            setEmail(DEMO_EMAIL)
            s.signIn(DEMO_EMAIL)
            s.go({ name: 'role' }, true)
          }}
        >
          Try the demo
        </Btn>
      </form>
    </div>
  )
}

export function RoleSelect() {
  const s = useStore()
  const pick = (r: 'talent' | 'company') => {
    s.setRole(r)
    s.go({ name: 'home' }, true)
  }
  const opts = [
    {
      r: 'talent' as const,
      icon: <GraduationCap size={28} />,
      title: "I'm a talent",
      sub: 'Find events and companies that fit how you work.',
      cls: 'bg-lime text-forest',
    },
    {
      r: 'company' as const,
      icon: <Briefcase size={28} />,
      title: "I'm a company",
      sub: 'Meet candidates who match your team and skills.',
      cls: 'bg-coral text-ink',
    },
  ]
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-paper px-5 py-10">
      <Logo />
      <h1 className="rise mt-10 font-display text-4xl font-extrabold leading-tight">
        Which side
        <br />
        are you on?
      </h1>
      <p className="mt-2 text-mute">You can switch any time from your profile.</p>
      <div className="mt-8 flex flex-1 flex-col gap-4">
        {opts.map((o, i) => (
          <button
            key={o.r}
            onClick={() => pick(o.r)}
            style={{ animationDelay: `${i * 100}ms` }}
            className={cx(
              'rise flex flex-1 flex-col justify-between rounded-[32px] p-6 text-left transition active:scale-[.98]',
              o.cls,
            )}
          >
            <div className="grid size-14 place-items-center rounded-2xl bg-black/10">{o.icon}</div>
            <div>
              <div className="font-display text-3xl font-extrabold">{o.title}</div>
              <div className="mt-1 flex items-end justify-between gap-4">
                <span className="max-w-[14rem] opacity-80">{o.sub}</span>
                <ArrowRight />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
