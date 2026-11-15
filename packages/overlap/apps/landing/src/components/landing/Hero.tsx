import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUp, LoaderCircle, Pause, Play, Plus } from 'lucide-react'
import { DepthField } from '@/components/depth-field'
import { LiquidGlassOrb, type LiquidGlassOrbState } from '@/components/liquid-glass-orb'
import {
  SoapBubbleButton,
  SoapBubbleIconButton,
  SoapBubbleMaterial,
  SoapBubbleMenu,
  SoapBubbleSlider,
  SoapBubbleToggle,
} from '@/components/soap-bubble'
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from '@/components/ui/prompt-input'
import type { EventInfo } from '@/data/event'
import { ASK_SUGGESTIONS, EVENTS, SKULL_ASK, eventImage } from '@/data/events'
import { sitePath } from '@/lib/base'
import { EspooLockup } from './EspooLockup'
import { GetStarted } from './GetStarted'
import { PLATFORMS } from './platform-icons'
import { scrollToSection } from './scroll'
import { FIELD, GLASS, ORB, PALETTE } from './settings'
import { SkullWall } from './SkullWall'
import { useAskFlow, type AskPhase } from './use-ask-flow'
import { FLASH, useErrorFlash } from './use-error-flash'
import './hero.css'

const ORB_STATE: Record<AskPhase, LiquidGlassOrbState> = {
  idle: 'idle',
  listening: 'listening',
  thinking: 'thinking',
  searching: 'searching',
  speaking: 'speaking',
  error: 'error',
}

// What assistive technology reads; the eye sees the same sentence with the glyphs (.ask-hint).
const ASK_PLACEHOLDER = `Give your public profile: ${PLATFORMS.map(({ name }) => name).join(', ')}…`

export type HeroProps = {
  /** Where "Get started" goes: /get-started (GET_STARTED_URL), the page in front of the platform. */
  getStartedUrl: string
  /** The event a profile is matched against. */
  event: EventInfo
}

/**
 * The landing page's one interactive island. The event cards travel through the depth field in
 * the background; the orb and the single ask box sit in the middle; the glass controls filter
 * what is in the field. All of it shares one small state machine (useAskFlow).
 */
export default function Hero({ getStartedUrl, event }: HeroProps) {
  const flow = useAskFlow(event)
  const [value, setValue] = useState('')
  const [paused, setPaused] = useState(false)
  const [fit, setFit] = useState(flow.filters.minFit)

  // The header is clear over the hero and frosts over once the hero has scrolled away under it.
  const hero = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const element = hero.current
    if (!element) return
    // 96px: sections scroll to 88px from the top, which must already count as "past the hero".
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      rootMargin: '-96px 0px 0px 0px',
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // An ask that fits nothing flashes the background red and zooms the scene (not the header). For
  // SKULL_ASK (the Steve Jobs pill) the red is full of skulls: the wall is on the page from that ask
  // until the next, so it is laid out (and on a device with no emoji font, its face fetched) in the
  // ask's thinking and searching beats, which last at least 500 ms (`pace`, use-ask-flow.ts). No
  // other visitor pays for it.
  const scene = useRef<HTMLDivElement>(null)
  const flash = useRef<HTMLDivElement>(null)
  useErrorFlash(flow.phase, flash, scene)

  // The orb answers typing and "speaks" its answer through one level function, read per frame by
  // its own render loop: no React state per sample.
  const phase = useRef(flow.phase)
  useEffect(() => {
    phase.current = flow.phase
  }, [flow.phase])
  const keys = useRef({ peak: 0, at: 0 })
  const typingLevel = () => keys.current.peak * Math.exp(-(performance.now() - keys.current.at) / 220)
  const getAudioLevel = useCallback(() => {
    if (phase.current === 'speaking') {
      const t = performance.now() / 1000
      // Irregular syllables with breathing pauses rather than a steady beat.
      const syllable = Math.abs(Math.sin(t * 7.3)) * (0.6 + 0.4 * Math.sin(t * 2.1 + 1.3))
      const breath = Math.sin(t * 0.9) > -0.75 ? 1 : 0.15
      return Math.min(1, Math.max(0, 0.18 + 0.72 * syllable * breath))
    }
    if (phase.current === 'listening') return Math.min(1, 0.12 + typingLevel())
    return ORB.audioLevel
  }, [])

  const onType = (next: string) => {
    setValue(next)
    keys.current = { peak: Math.min(0.9, typingLevel() + 0.4), at: performance.now() }
  }
  const submit = (text = value) => {
    if (flow.busy) return
    flow.ask(text)
  }

  // The slider moves freely; the field only re-forms once it has rested.
  const { setFilters } = flow
  const appliedFit = flow.filters.minFit
  useEffect(() => {
    if (fit === appliedFit) return
    const id = window.setTimeout(() => setFilters({ minFit: fit }), 320)
    return () => window.clearTimeout(id)
  }, [fit, appliedFit, setFilters])

  const images = useMemo(() => flow.shown.map(eventImage), [flow.shown])
  // Fewer answers, fewer planes: a short list should read as a short list.
  const planes = Math.min(FIELD.count, Math.max(10, images.length * 4))

  return (
    <section
      ref={hero}
      className="hero"
      data-phase={flow.phase}
      data-scrolled={scrolled ? '' : undefined}
      aria-labelledby="hero-title"
    >
      {/* No `backdrop` on this material: a backdrop is a still capture, and what is behind the
          glass here (the cards) never stops moving, so the live page shows through instead. The
          closing section, whose artwork is static, uses the captured backdrop (FinalCta.tsx). */}
      <SoapBubbleMaterial {...GLASS}>
        <header className="site-header" data-scrolled={scrolled ? '' : undefined}>
          <a className="logo" href={sitePath('/')}>
            <EspooLockup />
          </a>
          <nav className="site-tools" aria-label="Page">
            <SoapBubbleMenu
              round
              label="•••"
              triggerLabel="More"
              align="end"
              items={[
                { label: 'How it works', onSelect: () => scrollToSection('how') },
                { label: 'For talent', onSelect: () => scrollToSection('talent') },
                { label: 'For companies', onSelect: () => scrollToSection('companies') },
              ]}
            />
            <SoapBubbleIconButton
              className="site-tool-wide"
              aria-label={paused ? 'Play the background motion' : 'Pause the background motion'}
              aria-pressed={paused}
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
            </SoapBubbleIconButton>
            <SoapBubbleIconButton
              className="site-tool-wide"
              aria-label="Add your event"
              tint={PALETTE.limeRgb}
              opacity={0.92}
              onClick={() => scrollToSection('companies')}
            >
              <Plus aria-hidden="true" />
            </SoapBubbleIconButton>
          </nav>
          <GetStarted className="site-cta" getStartedUrl={getStartedUrl} paused={paused} />
        </header>

        {/* Everything but the header, in a box the size of the hero (so the sizes and positions
            below resolve as before). The error flash zooms it; the header stays out because a
            transformed ancestor would become the containing block of its position: fixed. */}
        <div ref={scene} className="hero-scene">
          <DepthField
            {...FIELD}
            className="event-field"
            images={images}
            count={planes}
            // The search rushes the cards past; the answer arrives at the usual pace.
            speed={flow.phase === 'searching' ? FIELD.speed * 3.2 : FIELD.speed}
            paused={paused}
            showText={false}
            background={PALETTE.paper}
            color={PALETTE.ink}
            // Stretched upwards so the field's centre (its vanishing point) sits behind the orb.
            height="calc(200% - 2 * var(--origin-y))"
            style={{ top: 'calc(2 * var(--origin-y) - 100%)' }}
          />
          <div className="hero-scrim" aria-hidden="true" />
          <div ref={flash} className="hero-flash" aria-hidden="true" style={{ background: FLASH.color }}>
            {flow.asked === SKULL_ASK && <SkullWall />}
          </div>

          <div className="hero-stack">
            <div className="orb-slot">
              <div className="orb-fit">
                <LiquidGlassOrb {...ORB} paused={paused} state={ORB_STATE[flow.phase]} getAudioLevel={getAudioLevel} />
              </div>
            </div>
            <h1 id="hero-title" className="hero-title">
              See how talented{' '}
              <span className="hero-title-emoji" role="img" aria-label="you">
                🫵
              </span>{' '}
              are?
            </h1>
            <p className="hero-sub">
              Give your public profile. Overlap ranks how well you match the people in the room.
            </p>

            <PromptInput
              className="ask-box"
              value={value}
              onValueChange={onType}
              onSubmit={() => submit()}
              isLoading={flow.busy}
              maxHeight={132}
            >
              {/* A native placeholder cannot hold the platforms' glyphs. The textarea keeps the
                  sentence for assistive technology (made transparent in hero.css); the hint, its
                  next sibling, shows the prompt and logos in the same grid cell while it is empty. */}
              <div className="ask-field">
                <PromptInputTextarea
                  className="ask-input"
                  aria-label="What are you looking for?"
                  placeholder={ASK_PLACEHOLDER}
                  enterKeyHint="search"
                  maxLength={160}
                  onFocus={() => flow.setListening(true)}
                  onBlur={() => flow.setListening(false)}
                />
                <p className="ask-hint" aria-hidden="true">
                  Give your public profile:{' '}
                  {PLATFORMS.map(({ name, Icon }) => (
                    <Fragment key={name}>
                      <span className="ask-hint-item">
                        <Icon className="ask-hint-icon" />
                      </span>{' '}
                    </Fragment>
                  ))}
                </p>
              </div>
              <PromptInputActions className="ask-actions">
                <p className="ask-status" role="status" aria-live="polite">
                  {flow.message}
                </p>
                <PromptInputAction tooltip={flow.busy ? 'Searching…' : 'Find my events'}>
                  <button
                    type="button"
                    className="ask-send"
                    aria-label="Find my events"
                    disabled={flow.busy}
                    onClick={() => submit()}
                  >
                    {flow.busy ? (
                      <LoaderCircle className="ask-spin" aria-hidden="true" />
                    ) : (
                      <ArrowUp aria-hidden="true" />
                    )}
                  </button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>

            <ul className="ask-chips" aria-label="Try an example profile">
              {ASK_SUGGESTIONS.map(({ label, value }) => (
                <li key={label}>
                  <button type="button" className="ask-chip" disabled={flow.busy} onClick={() => setValue(value)}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="dock" role="group" aria-label="Filter the events" hidden>
            <label className="dock-item">
              <span className="dock-label">Online only</span>
              <SoapBubbleToggle
                aria-label="Online only"
                checked={flow.filters.onlineOnly}
                onCheckedChange={(onlineOnly) => flow.setFilters({ onlineOnly })}
                color={PALETTE.forest}
                scale={1.2}
              />
            </label>
            <div className="dock-item dock-fit">
              <span className="dock-label" aria-hidden="true">
                Minimum fit <output>{fit}+</output>
              </span>
              <SoapBubbleSlider
                label="Minimum fit"
                value={fit}
                min={0}
                max={95}
                step={5}
                onValueChange={setFit}
                from={PALETTE.forest}
                to={PALETTE.lime}
                scale={1.2}
              />
            </div>
            <SoapBubbleButton className="dock-continue" onClick={() => scrollToSection('how')}>
              Continue
            </SoapBubbleButton>
          </div>
        </div>
      </SoapBubbleMaterial>

      <p className="sr-only" aria-live="polite">
        {flow.shown.length} of {EVENTS.length} events in view.
      </p>
    </section>
  )
}
