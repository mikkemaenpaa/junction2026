/*
 * The caller's voice on the answered call (IncomingCall.tsx): a few recordings, each played once.
 *
 * Through the Web Audio API, not an <audio> element: the recordings start some time after the
 * click that answers, and Safari refuses an element's play() outside a click. An AudioContext
 * opened by that click may play later.
 */
import { openCallAudio } from './call-audio'

/** One thing the caller says. */
export type VoiceLine = {
  /** Where the recording is. */
  url: string
  /** Seconds into the call at which it starts. */
  at: number
}

const ignore = () => {}

/**
 * Plays each of `lines` once, at its time into the call that starts now, and returns the function
 * that cuts the caller off, lines not yet spoken included. Call it in the browser only. The times
 * run on the audio clock (see call-audio.ts). The lines must not overlap: nothing keeps them apart.
 */
export function playVoice(lines: readonly VoiceLine[]): () => void {
  const audio = openCallAudio(1)
  if (!audio) return ignore
  const { context, output } = audio
  const answered = context.currentTime

  // All recordings are fetched now, so that a slow network cannot make a later line late.
  let stopped = false
  for (const { url, at } of lines) {
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`${url}: ${response.status}`)
        return response.arrayBuffer()
      })
      .then((data) => context.decodeAudioData(data))
      .then((recording) => {
        if (stopped) return
        const source = context.createBufferSource()
        source.buffer = recording
        source.connect(output)
        // A recording that arrives after its time starts at once: a start time in the past means now.
        source.start(answered + at)
      })
      // No recording, no line: the call goes on without it.
      .catch(ignore)
  }

  return () => {
    stopped = true
    audio.close()
  }
}
