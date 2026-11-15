// The 1200x630 social image: the logo and headline on paper, with a fan of three event cards.
import { DISPLAY } from './fonts'
import { PALETTE } from './theme'
import { TITLE_TRACKING, type TitleFit } from './title'

export const OG_SIZE = { width: 1200, height: 630 }
export const OG_HEADLINE = 'Events where you’ll fit in.'
/** Room for the headline: the left column under the logo. */
export const OG_HEADLINE_BOX = { width: 500, height: 240, minLines: 2, maxLines: 2, minSize: 64, maxSize: 96 }

const PAD = 80

/** The app's logo (apps/app/src/ui.tsx, `Logo`) at `scale` times its size there. */
function Logo({ scale }: { scale: number }) {
  const box = 32 * scale
  const dot = 20 * scale
  const ring = 2 * scale
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 * scale }}>
      <div style={{ display: 'flex', position: 'relative', width: box, height: box }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: dot,
            height: dot,
            borderRadius: dot,
            backgroundColor: PALETTE.lime,
            // Tailwind's ring-2: a 2px ring outside the circle.
            boxShadow: `0 0 0 ${ring}px ${PALETTE.forest}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot,
            backgroundColor: PALETTE.coral,
            mixBlendMode: 'multiply',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 24 * scale,
          letterSpacing: -0.025 * 24 * scale,
          lineHeight: 1,
          color: PALETTE.forest,
        }}
      >
        overlap
      </div>
    </div>
  )
}

/**
 * One card of the fan: its rendered PNG (a data URL) at native size, scaled and turned about its
 * centre. Satori clips nested positioned content wrongly inside a turned box, so the cards go in
 * as images rather than as element trees.
 */
export type FanCard = { src: string; width: number; height: number }

const FAN = [
  { x: 752, y: 148, rotate: -12, scale: 0.54 },
  { x: 1040, y: 162, rotate: 9, scale: 0.54 },
  { x: 896, y: 116, rotate: -2, scale: 0.62 },
] as const

export function OgImage({ headline, cards }: { headline: TitleFit; cards: readonly FanCard[] }) {
  return (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        overflow: 'hidden',
        backgroundColor: PALETTE.paper,
      }}
    >
      {cards.slice(0, FAN.length).map(({ src, width, height }, index) => {
        const { x, y, rotate, scale } = FAN[index]!
        return (
          <img
            key={index}
            src={src}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              // (x, y): where the top centre of the scaled card lands.
              left: x - width / 2,
              top: y - (height * (1 - scale)) / 2,
              borderRadius: (12 / 150) * Math.max(width, height),
              boxShadow: '0 32px 64px rgba(17, 32, 28, 0.2)',
              transform: `rotate(${rotate}deg) scale(${scale})`,
            }}
          />
        )
      })}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'absolute',
          left: PAD,
          top: PAD - 8,
          bottom: PAD - 8,
        }}
      >
        <Logo scale={1.75} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: headline.fontSize,
            lineHeight: `${headline.lineHeight}px`,
            letterSpacing: TITLE_TRACKING * headline.fontSize,
            color: PALETTE.ink,
          }}
        >
          {headline.lines.map((line) => (
            <div key={line} style={{ display: 'flex', whiteSpace: 'pre' }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
