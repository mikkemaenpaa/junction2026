// LinkedIn sends the applicant back here after they consent. Reads their data once with a
// short-lived token, which is not stored.
import type { APIRoute } from 'astro'
import { SNAPSHOT_DOMAINS, STATE_COOKIE, exchangeCode, fetchSnapshot } from '../../../lib/linkedin.ts'
import { writeData } from '../../../lib/store.ts'

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

export const GET: APIRoute = async ({ url, cookies }) => {
  const error = url.searchParams.get('error')
  if (error)
    return text(`LinkedIn did not grant access: ${error}\n${url.searchParams.get('error_description') ?? ''}`, 400)

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state || state !== cookies.get(STATE_COOKIE)?.value)
    return text('This sign-in link is not valid any more. Start again from /api/linkedin/start.', 400)
  cookies.delete(STATE_COOKIE, { path: '/api/linkedin' })

  let token: string
  try {
    token = await exchangeCode(code, `${url.origin}/api/linkedin/callback`)
  } catch (cause) {
    return text(cause instanceof Error ? cause.message : String(cause), 502)
  }

  const snapshot: Record<string, unknown> = {}
  const lines: string[] = []
  // A few domains at a time: LinkedIn does not publish its rate limits.
  const queue = [...SNAPSHOT_DOMAINS]
  const worker = async () => {
    for (let domain = queue.shift(); domain; domain = queue.shift()) {
      try {
        const rows = await fetchSnapshot(token, domain)
        snapshot[domain] = rows
        const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))]
        lines.push(
          `${domain.padEnd(26)} ${String(rows.length).padStart(5)} rows${fields.length ? `: ${fields.join(', ')}` : ''}`,
        )
      } catch (cause) {
        lines.push(`${domain.padEnd(26)} FAILED ${cause instanceof Error ? cause.message : String(cause)}`)
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker))
  writeData('linkedin-snapshot.json', snapshot)
  return text(`Read from LinkedIn:\n\n${lines.sort().join('\n')}\n`)
}
