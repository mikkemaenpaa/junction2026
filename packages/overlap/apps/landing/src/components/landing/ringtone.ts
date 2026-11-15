/*
 * The ringtone of the incoming call (IncomingCall.tsx): a marimba phrase written for this page
 * and synthesised with the Web Audio API. There is no audio file to ship or to license, and
 * nothing for the Content-Security-Policy to allow.
 */
import { openCallAudio } from './call-audio'

/** One strike of the phrase. */
export type RingNote = {
  /** Seconds since the ringing started. */
  time: number
  /** Hz. */
  frequency: number
  /** How hard the bar is struck, 0 to 1. */
  level: number
}

/** One step of the phrase, a sixteenth note at 120 bpm, in seconds. A power of two: times stay exact. */
const STEP = 0.125

// E major pentatonic, as MIDI note numbers.
const NOTE = { B4: 71, E5: 76, Fs5: 78, Gs5: 80, B5: 83, Cs6: 85, E6: 88 } as const

/** The phrase as [step, MIDI note, level]: four bars of eight steps, the downbeats struck hardest. */
const PHRASE: ReadonlyArray<readonly [step: number, note: number, level: number]> = [
  [0, NOTE.E5, 1],
  [1, NOTE.B4, 0.6],
  [2, NOTE.Gs5, 0.75],
  [3, NOTE.E5, 0.6],
  [4, NOTE.B5, 0.9],
  [6, NOTE.Gs5, 0.7],

  [8, NOTE.Cs6, 1],
  [9, NOTE.B5, 0.6],
  [10, NOTE.Gs5, 0.75],
  [11, NOTE.E5, 0.6],
  [12, NOTE.Fs5, 0.9],
  [14, NOTE.B4, 0.7],

  [16, NOTE.E5, 1],
  [17, NOTE.B4, 0.6],
  [18, NOTE.Gs5, 0.75],
  [19, NOTE.E5, 0.6],
  [20, NOTE.B5, 0.9],
  [22, NOTE.Cs6, 0.8],

  [24, NOTE.E6, 1],
  [26, NOTE.B5, 0.7],
  [27, NOTE.Gs5, 0.7],
  [28, NOTE.E5, 0.9],
]

/** The phrase and the pause after it, in seconds: the ringtone repeats this often. */
export const RING_LOOP = 40 * STEP

const NOTES: readonly RingNote[] = PHRASE.map(([step, note, level]) => ({
  time: step * STEP,
  frequency: 440 * 2 ** ((note - 69) / 12),
  level,
}))

/**
 * The strikes of the repeating phrase that start in [from, to), in order. Back-to-back windows
 * neither repeat nor drop a strike: a strike's time is computed the same way in each of them.
 */
export function notesBetween(from: number, to: number): RingNote[] {
  const notes: RingNote[] = []
  if (!(to > from)) return notes
  const last = Math.floor(to / RING_LOOP)
  for (let loop = Math.max(0, Math.floor(from / RING_LOOP)); loop <= last; loop++) {
    for (const note of NOTES) {
      const time = loop * RING_LOOP + note.time
      if (time >= from && time < to) notes.push({ ...note, time })
    }
  }
  return notes
}

/**
 * What one struck bar is made of, as [pitch as a multiple of the note, loudness, length as a share
 * of the note's]: the note itself, the overtone a marimba bar is tuned to (two octaves up), and
 * the knock of the mallet.
 */
const PARTIALS = [
  [1, 0.9, 1],
  [4, 0.22, 0.3],
  [9.2, 0.07, 0.07],
] as const

/** Seconds a bar takes to reach full loudness. Not zero: a wave that starts mid-swing clicks. */
const ATTACK = 0.003
/** Where a bar's fade ends (-60 dB); an exponential ramp cannot reach zero. */
const SILENT = 0.001

/** Plays one bar on `output`, struck at `at` on the context's clock. */
function strike(context: BaseAudioContext, output: AudioNode, at: number, { frequency, level }: RingNote) {
  // The higher the bar, the shorter it rings: 0.6 s at C5.
  const ring = 0.6 * Math.sqrt(523.25 / frequency)
  for (const [ratio, loudness, length] of PARTIALS) {
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const end = at + ring * length
    oscillator.frequency.value = frequency * ratio
    envelope.gain.setValueAtTime(SILENT, at)
    envelope.gain.linearRampToValueAtTime(level * loudness, at + ATTACK)
    envelope.gain.exponentialRampToValueAtTime(SILENT, end)
    oscillator.connect(envelope).connect(output)
    oscillator.start(at)
    oscillator.stop(end)
  }
}

const VOLUME = 0.3
/** Seconds of strikes kept queued on the audio clock, so a busy main thread cannot make it stutter. */
const LOOKAHEAD = 0.8
/** How often the queue is topped up, in milliseconds. */
const TICK = 100
/** Seconds from the sound being let through to the first strike. */
const LEAD = 0.06

const ignore = () => {}

/**
 * Starts ringing and returns the function that stops it. Call it in the browser only. When the
 * sound is let through is call-audio.ts's business.
 */
export function startRingtone(): () => void {
  const audio = openCallAudio(VOLUME)
  if (!audio) return ignore
  const { context, output } = audio

  // The audio clock only runs while the context does, so the phrase picks up where it was after
  // a pause. `origin` is the clock's time at the phrase's first strike.
  let origin: number | undefined
  let queued = 0
  const queue = () => {
    if (context.state !== 'running') return
    origin ??= context.currentTime + LEAD
    const now = context.currentTime - origin
    // Strikes a starved timer missed are dropped: queued late, they would all sound at once.
    for (const note of notesBetween(Math.max(queued, now), now + LOOKAHEAD)) {
      strike(context, output, origin + note.time, note)
    }
    queued = now + LOOKAHEAD
  }
  const timer = window.setInterval(queue, TICK)
  context.addEventListener('statechange', queue)

  return () => {
    window.clearInterval(timer)
    context.removeEventListener('statechange', queue)
    audio.close()
  }
}
