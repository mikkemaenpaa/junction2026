/*
 * The way out to the speakers for the sounds of the incoming call (ringtone.ts, voice.ts). Each
 * sound opens its own for as long as it lasts.
 *
 * A browser only lets a page make sound once the visitor has interacted with it. Until then the
 * AudioContext stays suspended, its clock stands still and whatever is scheduled on it waits; the
 * first click or key press anywhere on the page lets it through.
 */

export type CallAudio = {
  context: AudioContext
  /** Where the sound's nodes connect. */
  output: AudioNode
  /** Fades the sound out and lets the context go. */
  close: () => void
}

/** Seconds the sound takes to fade when it is closed. A cut mid-swing would click. */
const FADE = 0.12

const ignore = () => {}

/**
 * Opens a way out at `volume` (0 to 1), or nothing where the browser has no Web Audio. Call it in
 * the browser only. The sound is let through at once where the browser allows it and otherwise on
 * the visitor's first click or key press; a tab in the background stays quiet.
 */
export function openCallAudio(volume: number): CallAudio | undefined {
  if (typeof AudioContext === 'undefined') return undefined
  const context = new AudioContext()
  const output = context.createGain()
  output.gain.value = volume
  output.connect(context.destination)

  // Click and key-up rather than pointer-down and key-down: the press that lets the sound through
  // may be the one that ends it (the first thing a visitor does may be to decline the call), and
  // nothing may sound between that press and its click.
  const wake = () => {
    if (!document.hidden) context.resume().catch(ignore)
  }
  const onVisibility = () => {
    if (document.hidden) context.suspend().catch(ignore)
    else wake()
  }
  window.addEventListener('click', wake, true)
  window.addEventListener('keyup', wake, true)
  document.addEventListener('visibilitychange', onVisibility)
  onVisibility()

  const close = () => {
    window.removeEventListener('click', wake, true)
    window.removeEventListener('keyup', wake, true)
    document.removeEventListener('visibilitychange', onVisibility)
    output.gain.setTargetAtTime(0, context.currentTime, FADE / 5)
    window.setTimeout(() => {
      context.close().catch(ignore)
    }, FADE * 1000)
  }
  return { context, output, close }
}
