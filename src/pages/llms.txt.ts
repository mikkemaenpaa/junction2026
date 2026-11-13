// /llms.txt (https://llmstxt.org): an index of the site for AI agents, generated at build time
// from the challenge data like sitemap.xml, so every challenge is listed and the list cannot
// drift. Links point to the pages' Markdown twins (/index.md, /about.md, ...), which
// src/integrations/markdown-twins.ts builds from the HTML pages after this file is written; that
// integration also fails the build if a link here has no file or a twin is missing here, and
// writes /llms-full.txt (all twins in the order listed here).
import type { APIRoute } from "astro";
import { challengeSlug } from "../data/challenge-directory";
import { tracks, techChallenges, challengeCount, type Challenge, type TechChallenge } from "../data/challenges";

const mainCount = tracks.reduce((n, t) => n + t.challenges.length, 0);

/** First sentence of the task, cut at a word boundary if it is long. */
function shortDescription(task: string) {
  const first = task.match(/^.+?[.!?](?=\s+["“A-Z]|$)/)?.[0] ?? task;
  if (first.length <= 200) return first;
  const cut = first.slice(0, 200);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:—–-]+$/, "")}…`;
}

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("`site` must be set in astro.config.mjs to build llms.txt");
  const url = (path: string) => new URL(path, site).href;
  const challenge = (c: Challenge | TechChallenge) =>
    `- [${c.title} (${c.org})](${url(`/challenges/${challengeSlug(c)}.md`)}): ${shortDescription(c.task)}`;

  const lines = [
    "# Junction 2026",
    "",
    "> Junction 2026 is Europe's biggest hackathon: 2,000 builders, 48 hours and €100,000+ in prizes, 13–15 November 2026 at Hype Areena in Espoo, Finland.",
    "",
    `Junction 2026, the European Tech Renaissance, runs from Friday 13 to Sunday 15 November 2026 at Hype Areena, Espoo, Finland. Teams of 1 to 4 people build for 48 hours on ${challengeCount} challenges set by partner organisations: ${mainCount} main challenges in ${tracks.length} tracks, and ${techChallenges.length} tech challenges that can be combined with any main challenge. Each partner picks its own winners; the top 5 projects of the event pitch live to a grand jury. The schedule and FAQ are on the event info page.`,
    "",
    `The links below point to the Markdown version of each page. Every page in one file: [llms-full.txt](${url("/llms-full.txt")}).`,
    "",
    "## Pages",
    "",
    `- [Home](${url("/index.md")}): Junction 2026 at a glance, with a card for every challenge.`,
    `- [Challenges](${url("/challenges.md")}): All ${challengeCount} challenges by track with tasks, prizes and links, plus the partner list and how judging works.`,
    `- [Event info](${url("/about.md")}): Schedule (13–15 November 2026) and FAQ: venue, team size and combining challenges.`,
    `- [Privacy and cookies](${url("/privacy.md")}): What the site stores, Google Analytics only with consent, and your rights under the GDPR.`,
    ...tracks.flatMap((t) => ["", `## ${t.name}${t.by ? ` (by ${t.by})` : ""}`, "", ...t.challenges.map(challenge)]),
    "",
    "## Tech challenges",
    "",
    ...techChallenges.map(challenge),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
