import { useEffect, useState } from 'react'
import avatar from '@/assets/incoming-call-avatar.webp'
import areYouThere from '@/assets/incoming-call-voice-are-you-there.mp3'
import hello from '@/assets/incoming-call-voice-hello.mp3'
import { CallActivity } from '@/components/islandcn/call-activity'
import { Island, IslandProvider, useIsland } from '@/lib/island'
import { startRingtone } from './ringtone'
import { PALETTE } from './settings'
import { playVoice, type VoiceLine } from './voice'
import './incoming-call.css'

/** Who calls. */
const CALLER = 'Jeffrey Epstein'
/** The grey line above the name while it rings. */
const SUBTITLE = 'mobile'
/** The call's activity id on the island. */
const CALL_ID = 'incoming-call'
/** Milliseconds from the page's load until the phone rings. */
const RING_DELAY = 5500
/** What the caller says once the visitor has answered. */
const LINES: readonly VoiceLine[] = [
  { url: hello, at: 1.25 },
  { url: areYouThere, at: 11 },
]
/** The engine pins the island to the window's top; the stylesheet may move it down a little. */
const ISLAND_STYLE = { top: 'var(--incoming-call-top, 0px)' } as const

type CallPhase = { kind: 'waiting' } | { kind: 'ringing' } | { kind: 'active'; since: number } | { kind: 'ended' }

/**
 * A Dynamic Island at the top centre of the window that takes one phone call: shortly after the
 * page loads it rings, with a ringtone, until the visitor declines or accepts. Accepted, it shows
 * the call's timer until they hang up, and the caller speaks: a moment after the answer and once
 * more if the call lasts. It rings once per page load.
 */
export default function IncomingCall() {
  return (
    <IslandProvider>
      {/* The page is always light, so the island never draws the keyline it keeps for dark pages.
          `top` lines the resting pill up with the header (incoming-call.css). */}
      <Island placement="viewport" backdrop={PALETTE.paper} className="incoming-call" style={ISLAND_STYLE} />
      <Call />
    </IslandProvider>
  )
}

function Call() {
  const island = useIsland()
  const [call, setCall] = useState<CallPhase>({ kind: 'waiting' })
  const ringing = call.kind === 'ringing'
  const active = call.kind === 'active'

  useEffect(() => {
    const timer = window.setTimeout(() => setCall({ kind: 'ringing' }), RING_DELAY)
    return () => window.clearTimeout(timer)
  }, [])

  // The ringtone plays exactly as long as the call rings.
  useEffect(() => {
    if (!ringing) return
    return startRingtone()
  }, [ringing])

  // The caller speaks a moment after the answer and again later; hanging up cuts them off.
  useEffect(() => {
    if (!active) return
    return playVoice(LINES)
  }, [active])

  // The engine folds an expanded island on any press outside it and on Escape. While the call
  // rings, decline and accept must stay one press away, so it opens again at once.
  const presentation = island.presentation
  useEffect(() => {
    if (ringing && presentation !== 'expanded') island.expand(CALL_ID)
  }, [ringing, presentation, island])

  // Answered, the talking view opens expanded. The preset folds the island once on that change;
  // a parent's effects run after its children's, so this expand lands after that collapse.
  // A press outside may then fold the call to its compact pill, and pressing the pill opens it
  // again. The engine does that only for a press held 0.1 s or more and hands a shorter tap to the
  // activity's `onPress`, which a quick mouse click often is, so a tap opens it as well.
  useEffect(() => {
    if (!active) return
    island.expand(CALL_ID)
    island.update(CALL_ID, { onPress: () => island.expand(CALL_ID) })
  }, [active, island])

  if (call.kind === 'waiting' || call.kind === 'ended') return null
  return (
    <CallActivity
      id={CALL_ID}
      caller={CALLER}
      subtitle={SUBTITLE}
      avatar={avatar.src}
      state={call}
      onAccept={() => setCall({ kind: 'active', since: Date.now() })}
      onDecline={() => setCall({ kind: 'ended' })}
    />
  )
}
