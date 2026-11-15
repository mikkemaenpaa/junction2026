import { useRef } from 'react'
import { GetStarted } from '@/components/landing/GetStarted'
import { scrollToSection } from '@/components/landing/scroll'
import { GLASS } from '@/components/landing/settings'
import { SoapBubbleButton, SoapBubbleMaterial } from '@/components/soap-bubble'
import { EVENTS, EVENT_SHAPES, eventImage } from '@/data/events'
import './final-cta.css'

type Depth = 'far' | 'mid' | 'near'

/**
 * The collage, back to front: the far cards first and the near ones last, so the document order is
 * the depth order. Lime, coral, card and ink tones only, because forest cards vanish on the forest
 * band. Positions and the three depth looks are in final-cta.css.
 */
const COLLAGE = (
  [
    { id: 'demo-day-autumn', depth: 'far' }, // lime, square
    { id: 'pm-office-hours', depth: 'far' }, // card, landscape
    { id: 'creator-economy-summit', depth: 'far' }, // coral, portrait
    { id: 'typescript-deep-dive', depth: 'mid' }, // ink, portrait
    { id: 'design-systems-workshop', depth: 'mid' }, // lime, square
    { id: 'women-in-data', depth: 'mid' }, // coral, square: behind the glass button
    { id: 'brand-in-motion', depth: 'near' }, // coral, landscape
    { id: 'research-ops-breakfast', depth: 'near' }, // card, portrait
  ] satisfies { id: string; depth: Depth }[]
).flatMap(({ id, depth }) => EVENTS.filter((event) => event.id === id).map((event) => ({ event, depth })))

export type FinalCtaProps = {
  /** Where "Get started" goes: /get-started (GET_STARTED_URL), the page in front of the platform. */
  getStartedUrl: string
}

/**
 * The closing call to action: the hero's centred stack again, on a forest band, with event cards
 * floating around it in depth. The glass button refracts the band's picture (`.cta-art`: the
 * forest, the cards and the scrim behind the copy), which never changes after render, so the
 * Bubble UI captures it once.
 */
export default function FinalCta({ getStartedUrl }: FinalCtaProps) {
  const bandRef = useRef<HTMLDivElement>(null)

  return (
    <section id="get-started" className="final-cta" aria-labelledby="cta-title">
      <div className="cta-band squircle-2xl">
        <div ref={bandRef} className="cta-art" aria-hidden="true">
          {COLLAGE.map(({ event, depth }, i) => {
            const { width, height } = EVENT_SHAPES[event.shape]
            return (
              <img
                key={event.id}
                className={`cta-card cta-card-${depth} cta-card-${i + 1}`}
                src={eventImage(event)}
                width={width}
                height={height}
                loading="lazy"
                decoding="async"
                alt=""
              />
            )
          })}
          <div className="cta-scrim" />
        </div>

        <div className="cta-copy">
          <h2 id="cta-title" className="cta-title">
            Find your overlap.
          </h2>
          <p className="cta-text">Three minutes to your first fit rating.</p>
          <div className="cta-actions">
            <GetStarted className="cta-form" getStartedUrl={getStartedUrl} />
            <SoapBubbleMaterial {...GLASS} backdrop={bandRef}>
              <SoapBubbleButton className="cta-glass" onClick={() => scrollToSection('how')}>
                How fit works
              </SoapBubbleButton>
            </SoapBubbleMaterial>
          </div>
        </div>
      </div>
    </section>
  )
}
