// Teams that have picked each main challenge so far, keyed by the challenge's slug in
// src/data/challenge-directory.ts, shown as a capsule on the home page cards, the /challenges
// cards and each challenge's own page (src/components/TeamCount.astro).
//
// To update: change the numbers and `teamCountsUpdated`, then build and deploy. Leave a
// challenge out to show no capsule for it. The total and the highest count (which fills the
// gauge) are computed below. The build fails if a key is not a challenge slug.
import { challengeDirectory } from "./challenge-directory";

export const teamCountsUpdated = { iso: "2026-11-14", label: "14.11.2026" };

export const teamCounts: Readonly<Record<string, number>> = {
  "valio-aimo-trusted-trade-agents": 105,
  "meta-ai-glasses-for-everyone-everyday": 73,
  "stoa-make-blueprints-talk": 70,
  "hostinger-decode-the-noise": 63,
  "bahn-express-spread": 61,
  "afterquery-break-the-agent": 60,
  "astrazeneca-equal-care-across-finland": 53,
  "s-pankki-personal-economic-trainer": 53,
  "aalto-university-beyond-the-clinic": 49,
  "exa-the-internet-butler-your-personal-assistant": 48,
  "arduino-the-green-european-renaissance": 43,
  "city-of-espoo-rethinking-recruitment": 41,
  "mariadb-wikipedia-through-time": 41,
  "cala-make-unicorns-real": 37,
  "context-dev-the-web-is-your-real-time-database": 36,
  "ignite-next-x-intel-stop-simulating-start-moving": 30,
  "tieto-earned-trust-in-ai-code": 25,
  "rokoko-the-robot-teleoperation-challenge": 17,
  "aalto-university-aaltonomous-humanoid": 13,
};

// A count for an unknown slug would silently show nowhere: fail the build instead.
const slugs = new Set(challengeDirectory.map((entry) => entry.slug));
for (const [slug, n] of Object.entries(teamCounts)) {
  if (!slugs.has(slug)) throw new Error(`Team count for unknown challenge slug "${slug}" (src/data/team-counts.ts)`);
  if (!Number.isInteger(n) || n < 0) throw new Error(`Team count for "${slug}" must be a whole number, got ${n}`);
}

export const teamTotal = Object.values(teamCounts).reduce((sum, n) => sum + n, 0);
export const teamMax = Math.max(1, ...Object.values(teamCounts));
