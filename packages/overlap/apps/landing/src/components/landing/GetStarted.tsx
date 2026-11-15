import { ChromaticButton } from '@/components/chromatic-button'
import { CHROMATIC } from './settings'

export type GetStartedProps = {
  /** Where the button goes: /get-started (GET_STARTED_URL), the page in front of the platform. */
  getStartedUrl: string
  className?: string
  /** Freezes the button's hue cycle (the page's pause control). */
  paused?: boolean
}

/**
 * The primary call to action: the Chromatic Button, as a real submit button in a GET form. The
 * form navigates even before the island hydrates; once it has, the submit goes straight to the
 * URL, which keeps the address clean (no trailing "?").
 */
export function GetStarted({ getStartedUrl, className, paused = false }: GetStartedProps) {
  return (
    <form
      className={className}
      action={getStartedUrl}
      method="get"
      onSubmit={(event) => {
        event.preventDefault()
        window.location.assign(getStartedUrl)
      }}
    >
      <ChromaticButton {...CHROMATIC} type="submit" paused={paused}>
        Get started
      </ChromaticButton>
    </form>
  )
}
