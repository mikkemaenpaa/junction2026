// Every challenge (main and tech) with its track name and URL slug, in page order.
// Ported from the original src/lib/challenge-directory.ts. One static page is built per
// entry at /challenges/<slug> (src/pages/challenges/[slug].astro).
import { tracks, techChallenges } from "./challenges";

export function challengeSlug(c: { org: string; title: string; slug?: string }) {
  return c.slug ?? `${c.org}-${c.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const challengeDirectory = [
  ...tracks.flatMap((track) => track.challenges.map((challenge) => ({ challenge, track: track.name, slug: challengeSlug(challenge) }))),
  ...techChallenges.map((challenge) => ({ challenge, track: "Tech challenges", slug: challengeSlug(challenge) })),
];

// Two challenges with the same slug would silently share one page: fail the build instead.
const seen = new Set<string>();
for (const { slug, challenge } of challengeDirectory) {
  if (!slug || seen.has(slug)) {
    throw new Error(`Duplicate or empty challenge slug "${slug}" (${challenge.org}: ${challenge.title})`);
  }
  seen.add(slug);
}
