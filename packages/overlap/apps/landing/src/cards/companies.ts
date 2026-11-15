// Company avatar hues, as in the app's mock data (apps/app/src/lib/data.ts, `COMPANIES[].hue`).
const HUES: Record<string, number> = {
  'Northwind Labs': 160,
  Paperplane: 18,
  'Atelier Vert': 140,
  'Helix Health': 200,
  'Loop & Co': 45,
  Tessera: 280,
  'Quanta Robotics': 330,
}

/** The app's fallback hue for a name without one (apps/app/src/ui.tsx, `hueOf`). */
function hueOf(name: string) {
  let sum = 0
  for (let index = 0; index < name.length; index++) sum += name.charCodeAt(index) * 7
  return sum % 360
}

export const companyHue = (name: string) => HUES[name] ?? hueOf(name)

/** Up to two initials, skipping words that do not start with a letter ("Loop & Co" -> "LC"). */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
