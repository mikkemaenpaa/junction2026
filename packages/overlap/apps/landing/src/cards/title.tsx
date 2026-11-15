// Fits an event title into its box: picks the line breaks and the largest font size at which the
// title fills the box's line range without overflowing. Widths are measured with satori itself
// (the same fonts, shaping and tracking as the final render), so the lines are exact.
import satori from 'satori'
import { DISPLAY, loadFonts } from './fonts'

/** Title tracking (em) and leading (of the font size). */
export const TITLE_TRACKING = -0.03
export const TITLE_LEADING = 1.02

export type TitleBox = {
  width: number
  height: number
  minLines: number
  maxLines: number
  minSize: number
  maxSize: number
}

export type TitleFit = { lines: string[]; fontSize: number; lineHeight: number }

/** Font size the widths are measured at; widths scale linearly with it. */
const REF = 200
const widths = new Map<string, number>()

async function measure(text: string): Promise<number> {
  const known = widths.get(text)
  if (known !== undefined) return known
  let width = 0
  await satori(
    <div
      style={{
        display: 'flex',
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: REF,
        letterSpacing: TITLE_TRACKING * REF,
        whiteSpace: 'pre',
      }}
    >
      {text}
    </div>,
    {
      height: REF * 2,
      fonts: await loadFonts(),
      pointScaleFactor: 0,
      onNodeDetected: (node) => {
        if (node.textContent === text) width = Math.max(width, node.width)
      },
    },
  )
  widths.set(text, width)
  return width
}

/** Every way to split `words` into `lines` consecutive, non-empty lines. */
function* splits(words: readonly string[], lines: number): Generator<string[]> {
  if (lines === 1) {
    yield [words.join(' ')]
    return
  }
  for (let take = 1; take <= words.length - lines + 1; take++) {
    const head = words.slice(0, take).join(' ')
    for (const rest of splits(words.slice(take), lines - 1)) yield [head, ...rest]
  }
}

/** Words a line should not end on ("Data for / Good Meetup"). */
const WEAK_ENDS = new Set(['&', 'a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to', 'with'])

export async function fitTitle(title: string, box: TitleBox): Promise<TitleFit> {
  const words = title.trim().split(/\s+/)
  const most = Math.min(box.maxLines, words.length)
  const least = Math.min(box.minLines, most)
  let best: (TitleFit & { score: number }) | undefined
  for (let count = least; count <= most; count++) {
    for (const lines of splits(words, count)) {
      const measured = await Promise.all(lines.map(measure))
      const widest = Math.max(...measured)
      let fontSize = Math.floor(Math.min(box.maxSize, (box.width / widest) * REF, box.height / (count * TITLE_LEADING)))
      // Satori rounds line heights to whole pixels.
      while (count * Math.round(fontSize * TITLE_LEADING) > box.height) fontSize--
      const weakEnds = lines.slice(0, -1).filter((line) => WEAK_ENDS.has(line.split(' ').at(-1)!.toLowerCase()))
      // Bigger is better; a line ending on a function word, a ragged stack and an extra line each
      // cost a little, so ties (titles capped at maxSize) go to the calmer, shorter setting.
      const score =
        fontSize * 0.9 ** weakEnds.length * (0.9 + 0.1 * (Math.min(...measured) / widest)) * 0.95 ** (count - least)
      if (!best || score > best.score)
        best = { lines, fontSize, lineHeight: Math.round(fontSize * TITLE_LEADING), score }
    }
  }
  const { lines, fontSize, lineHeight } = best!
  if (fontSize < box.minSize) console.warn(`[cards] "${title}" only fits at ${fontSize}px (min ${box.minSize}px)`)
  return { lines, fontSize, lineHeight }
}
