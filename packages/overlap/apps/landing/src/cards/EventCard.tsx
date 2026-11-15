// The event card image: the app's event card (apps/app/src/screens/Events.tsx) turned into a
// poster. Rendered by satori at build time, so only flexbox and satori's CSS subset are used, and
// every element with more than one child is `display: flex`.
import type { ReactNode } from 'react'
import { EVENT_SHAPES, type EventShape, type LandingEvent } from '@/data/events'
import { companyHue, initials } from './companies'
import { DISPLAY, TEXT } from './fonts'
import { COLOURWAYS, avatarColors, css, type Colourway, type Paint } from './theme'
import { TITLE_TRACKING, type TitleBox, type TitleFit } from './title'

type Circle = { x: number; y: number; r: number }

type Layout = {
  pad: number
  ring: { size: number; stroke: number }
  tag: { size: number; height: number }
  meta: { size: number; line: number; gap: number; icon: number }
  avatar: { size: number; border: number; overlap: number }
  /** Least space between the header and the title. */
  titleGap: number
  /** Sets the title low, on top of the details, instead of under the header. */
  titleLow?: boolean
  /** Least space between the title and the details. */
  spacer: number
  /** Space above and below the rule over the footer (portrait and square). */
  rule: number
  /** Decorative circles, in image pixels: the filled one, then the outlined one. */
  motif: [Circle, Circle]
  title: TitleBox
}

type LayoutSpec = Omit<Layout, 'title'> & { lines: [min: number, max: number]; sizes: [min: number, max: number] }

const RULE = 2
/** Space between the avatars and the "going" count in the landscape footer. */
const FOOTER_GAP = 10
/** Space between the title column and the ring in the landscape layout. */
const RING_GAP = 32

/** A shape's layout, with the title box set to the room the other parts leave. */
function layout(shape: EventShape, { lines, sizes, ...spec }: LayoutSpec): Layout {
  const { width, height } = EVENT_SHAPES[shape]
  const { pad, ring, tag, meta, avatar, titleGap, spacer, rule } = spec
  const details = 2 * meta.line + meta.gap
  const box =
    shape === 'landscape'
      ? {
          // Beside the ring; the footer holds the details on the left, avatars and count on the right.
          width: width - 2 * pad - ring.size - RING_GAP,
          height:
            height - 2 * pad - tag.height - titleGap - spacer - Math.max(details, avatar.size + FOOTER_GAP + meta.size),
        }
      : {
          // Under the header row; then the details, the rule and the footer.
          width: width - 2 * pad,
          height: height - 2 * pad - ring.size - titleGap - spacer - details - (2 * rule + RULE) - avatar.size,
        }
  return { ...spec, title: { ...box, minLines: lines[0], maxLines: lines[1], minSize: sizes[0], maxSize: sizes[1] } }
}

/**
 * Corner radius the page draws on the images (12px on the depth field's 150px box, which spans the
 * long side), in image pixels. Only the card colourway's keyline follows it.
 */
const pageRadius = (shape: EventShape) => {
  const { width, height } = EVENT_SHAPES[shape]
  return (12 / 150) * Math.max(width, height)
}

export const LAYOUTS: Record<EventShape, Layout> = {
  portrait: layout('portrait', {
    pad: 42,
    ring: { size: 100, stroke: 10 },
    tag: { size: 19, height: 40 },
    meta: { size: 20, line: 26, gap: 8, icon: 20 },
    avatar: { size: 52, border: 3, overlap: 10 },
    titleGap: 28,
    titleLow: true,
    spacer: 24,
    rule: 20,
    lines: [2, 4],
    sizes: [52, 84],
    motif: [
      { x: 50, y: 0, r: 170 },
      { x: 240, y: -40, r: 140 },
    ],
  }),
  square: layout('square', {
    pad: 44,
    ring: { size: 100, stroke: 10 },
    tag: { size: 20, height: 42 },
    meta: { size: 20, line: 26, gap: 8, icon: 20 },
    avatar: { size: 52, border: 3, overlap: 10 },
    titleGap: 26,
    spacer: 20,
    rule: 18,
    lines: [2, 3],
    sizes: [52, 80],
    motif: [
      { x: 210, y: -70, r: 160 },
      { x: 370, y: -20, r: 140 },
    ],
  }),
  landscape: layout('landscape', {
    pad: 40,
    ring: { size: 100, stroke: 10 },
    tag: { size: 19, height: 40 },
    meta: { size: 19, line: 25, gap: 8, icon: 19 },
    avatar: { size: 48, border: 3, overlap: 9 },
    titleGap: 20,
    spacer: 20,
    rule: 0,
    lines: [2, 3],
    sizes: [46, 72],
    motif: [
      { x: 600, y: 40, r: 170 },
      { x: 440, y: -40, r: 130 },
    ],
  }),
}

// Icons: Lucide (ISC) paths, drawn as inline SVG.
const ICONS = {
  calendar: (
    <>
      <path d="M8 2v3" />
      <path d="M16 2v3" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
}

function Icon({ name, size, paint }: { name: keyof typeof ICONS; size: number; paint: Paint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={paint.hex}
      strokeOpacity={paint.alpha}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}

/** The app's fit ring: a track and a progress arc from 12 o'clock with round caps, the score inside. */
function Ring({ value, size, stroke, colours }: { value: number; size: number; stroke: number; colours: Colourway }) {
  const c = size / 2
  const r = (size - stroke) / 2
  const angle = (Math.min(Math.max(value, 0), 100) / 100) * 2 * Math.PI
  const end = { x: (c + r * Math.sin(angle)).toFixed(2), y: (c - r * Math.cos(angle)).toFixed(2) }
  const { track, stroke: arc, number } = colours.ring
  const ring = { fill: 'none', strokeWidth: stroke }
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', left: 0, top: 0 }}>
        <circle cx={c} cy={c} r={r} stroke={track.hex} strokeOpacity={track.alpha} {...ring} />
        {value >= 100 ? (
          <circle cx={c} cy={c} r={r} stroke={arc(value)} {...ring} />
        ) : value > 0 ? (
          <path
            d={`M ${c} ${c - r} A ${r} ${r} 0 ${angle > Math.PI ? 1 : 0} 1 ${end.x} ${end.y}`}
            stroke={arc(value)}
            strokeLinecap="round"
            {...ring}
          />
        ) : null}
      </svg>
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: Math.round(size * 0.34),
          letterSpacing: -0.02 * size * 0.34,
          color: number,
          lineHeight: 1,
          // Optical centring: lining figures sit above the middle of the line box.
          marginTop: Math.round(size * 0.02),
        }}
      >
        {String(value)}
      </div>
    </div>
  )
}

function Tag({ children, layout, colours }: { children: string; layout: Layout; colours: Colourway }) {
  const { size, height } = layout.tag
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height,
        padding: `0 ${Math.round(height * 0.42)}px`,
        borderRadius: height,
        backgroundColor: css(colours.tag.background),
        color: colours.tag.color,
        fontFamily: TEXT,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  )
}

function Title({ fit, colours }: { fit: TitleFit; colours: Colourway }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: fit.fontSize,
        lineHeight: `${fit.lineHeight}px`,
        letterSpacing: TITLE_TRACKING * fit.fontSize,
        color: colours.title,
      }}
    >
      {fit.lines.map((line) => (
        <div key={line} style={{ display: 'flex', whiteSpace: 'pre' }}>
          {line}
        </div>
      ))}
    </div>
  )
}

function MetaRow({
  icon,
  children,
  layout,
  colours,
}: {
  icon: keyof typeof ICONS
  children: string
  layout: Layout
  colours: Colourway
}) {
  const { size, line, icon: iconSize } = layout.meta
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: line, gap: Math.round(size * 0.5) }}>
      <Icon name={icon} size={iconSize} paint={colours.text} />
      <div
        style={{
          display: 'flex',
          fontFamily: TEXT,
          fontWeight: 500,
          fontSize: size,
          lineHeight: 1,
          color: css(colours.text),
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Details({ event, layout, colours }: { event: LandingEvent; layout: Layout; colours: Colourway }) {
  const place = event.online ? `Online · ${event.venue}` : `${event.city} · ${event.venue}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: layout.meta.gap }}>
      <MetaRow icon="calendar" layout={layout} colours={colours}>
        {`${event.date} · ${event.time}`}
      </MetaRow>
      <MetaRow icon={event.online ? 'globe' : 'pin'} layout={layout} colours={colours}>
        {place}
      </MetaRow>
    </div>
  )
}

function Avatars({ names, layout, colours }: { names: readonly string[]; layout: Layout; colours: Colourway }) {
  const { size, border, overlap } = layout.avatar
  const inner = size - 2 * border
  return (
    <div style={{ display: 'flex' }}>
      {names.slice(0, 4).map((name, index) => (
        <div
          key={name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            width: size,
            height: size,
            marginLeft: index ? -overlap : 0,
            border: `${border}px solid ${colours.background}`,
            // The app's square avatar: rounded-xl (12px) on 44px.
            borderRadius: Math.round(inner * 0.28) + border,
            ...avatarColors(companyHue(name)),
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: Math.round(inner * 0.38),
            letterSpacing: -0.01 * inner * 0.38,
            lineHeight: 1,
          }}
        >
          {initials(name)}
        </div>
      ))}
    </div>
  )
}

function Going({ going, layout, colours }: { going: number; layout: Layout; colours: Colourway }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: Math.round(layout.meta.size * 0.3),
        fontFamily: TEXT,
        fontSize: layout.meta.size,
        lineHeight: 1,
        color: css(colours.text),
      }}
    >
      <div style={{ display: 'flex', fontWeight: 700, color: colours.title }}>{String(going)}</div>
      <div style={{ display: 'flex', fontWeight: 500 }}>going</div>
    </div>
  )
}

function Rule({ colours, margin }: { colours: Colourway; margin: number }) {
  return <div style={{ display: 'flex', height: RULE, margin: `${margin}px 0`, backgroundColor: css(colours.rule) }} />
}

/** The motif's circles, drawn relative to a box whose top left is at `origin` in image pixels. */
function Motif({ circles, colours, origin = 0 }: { circles: [Circle, Circle]; colours: Colourway; origin?: number }) {
  const [filled, outlined] = circles
  const box = ({ x, y, r }: Circle) =>
    ({
      position: 'absolute',
      left: x - r - origin,
      top: y - r - origin,
      width: 2 * r,
      height: 2 * r,
      borderRadius: r,
    }) as const
  return (
    <>
      <div style={{ ...box(filled), backgroundColor: css(colours.motif.fill) }} />
      <div style={{ ...box(outlined), border: `3px solid ${css(colours.motif.line)}` }} />
    </>
  )
}

/** Inset of the keyline from the image edge. */
const KEYLINE_INSET = 14
const KEYLINE = 2

function Canvas({
  shape,
  colours,
  layout,
  mirror,
  children,
}: {
  shape: EventShape
  colours: Colourway
  layout: Layout
  mirror: boolean
  children: ReactNode
}) {
  const { width, height } = EVENT_SHAPES[shape]
  const motif = mirror ? (layout.motif.map((c) => ({ ...c, x: width - c.x })) as [Circle, Circle]) : layout.motif
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        backgroundColor: colours.background,
      }}
    >
      {colours.keyline ? (
        // The light colourway is framed by a keyline concentric with the page's rounded corners;
        // the motif stays inside the frame.
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: KEYLINE_INSET,
            top: KEYLINE_INSET,
            right: KEYLINE_INSET,
            bottom: KEYLINE_INSET,
            overflow: 'hidden',
            border: `${KEYLINE}px solid ${colours.keyline}`,
            borderRadius: pageRadius(shape) - KEYLINE_INSET,
          }}
        >
          <Motif circles={motif} colours={colours} origin={KEYLINE_INSET + KEYLINE} />
        </div>
      ) : (
        <Motif circles={motif} colours={colours} />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxSizing: 'border-box',
          width,
          height,
          padding: layout.pad,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export type EventCardProps = {
  event: LandingEvent
  title: TitleFit
  /** Draws the motif mirrored left to right, so neighbouring cards of a shape differ. */
  mirror?: boolean
}

export function EventCard({ event, title, mirror = false }: EventCardProps) {
  const colours = COLOURWAYS[event.tone]
  const layout = LAYOUTS[event.shape]
  const ring = <Ring value={event.fit} size={layout.ring.size} stroke={layout.ring.stroke} colours={colours} />
  const tag = (
    <Tag layout={layout} colours={colours}>
      {event.category}
    </Tag>
  )
  const props = { layout, colours }

  if (event.shape === 'landscape') {
    return (
      <Canvas shape={event.shape} mirror={mirror} {...props}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: layout.titleGap }}>
            {tag}
            <Title fit={title} colours={colours} />
          </div>
          {ring}
        </div>
        <div style={{ display: 'flex', flexGrow: 1, minHeight: layout.spacer }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Details event={event} {...props} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: FOOTER_GAP }}>
            <Avatars names={event.companies} {...props} />
            <Going going={event.going} {...props} />
          </div>
        </div>
      </Canvas>
    )
  }

  return (
    <Canvas shape={event.shape} mirror={mirror} {...props}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {tag}
        {ring}
      </div>
      {/* Spare height goes above the title (portrait: type set low, like a poster) or below it. */}
      <div style={{ display: 'flex', flexGrow: layout.titleLow ? 1 : 0, minHeight: layout.titleGap }} />
      <Title fit={title} colours={colours} />
      <div style={{ display: 'flex', flexGrow: layout.titleLow ? 0 : 1, minHeight: layout.spacer }} />
      <Details event={event} {...props} />
      <Rule colours={colours} margin={layout.rule} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Avatars names={event.companies} {...props} />
        <Going going={event.going} {...props} />
      </div>
    </Canvas>
  )
}
