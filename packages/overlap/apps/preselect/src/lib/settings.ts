// Settings from the environment, or from a .env file in this app or the repo root. Server-side only.
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function setting(name: string, fallback?: string): string {
  let value = process.env[name]
  for (const file of ['.env', '../../.env']) {
    if (value) break
    const path = resolve(process.cwd(), file)
    if (!existsSync(path)) continue
    value = readFileSync(path, 'utf8').match(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^"'\\s#]+)`, 'm'))?.[1]
  }
  value ??= fallback
  if (!value) throw new Error(`${name} is not set (environment, .env here or in the repo root)`)
  return value
}
