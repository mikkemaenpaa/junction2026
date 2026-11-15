import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { parseFile } from './contextdev.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

function reply(body: unknown, status = 200) {
  vi.stubEnv('CONTEXT_DEV_API_KEY', 'test-key')
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('file conversion', () => {
  it('requests OCR for all PDF pages and preserves links and the returned Markdown', async () => {
    const markdown = '## Projects\n[Satellite](https://example.org) in Python'
    const fetch = reply({ success: true, markdown, key_metadata: { credits_consumed: 3 } })
    const bytes = new Uint8Array([37, 80, 68, 70])
    expect(await parseFile(bytes, 'pdf')).toEqual({ markdown, credits: 3 })
    const [url, request] = fetch.mock.calls[0]!
    const params = new URL(url).searchParams
    expect(params.get('ocr')).toBe('true')
    expect(params.get('includeLinks')).toBe('true')
    expect(params.has('pdf')).toBe(false)
    expect(request.body).toBe(bytes)
    expect(request.headers['Content-Type']).toBe('application/octet-stream')
  })

  it('does not request PDF OCR for text documents', async () => {
    const fetch = reply({ success: true, markdown: 'Python' })
    await parseFile(new Uint8Array(), 'txt')
    expect(new URL(fetch.mock.calls[0]![0]).searchParams.has('ocr')).toBe(false)
  })

  it.each([{ success: false, markdown: 'partial' }, {}, { markdown: 123 }])(
    'rejects an invalid conversion response: %j',
    async (body) => {
      reply(body)
      await expect(parseFile(new Uint8Array(), 'pdf')).rejects.toThrow('invalid or unsuccessful response')
    },
  )

  it('reports an HTTP conversion error', async () => {
    reply({ error_code: 'UNSUPPORTED_CONTENT', message: 'Cannot read file' }, 415)
    await expect(parseFile(new Uint8Array(), 'pdf')).rejects.toThrow('UNSUPPORTED_CONTENT')
  })
})
