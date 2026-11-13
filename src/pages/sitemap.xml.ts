// /sitemap.xml, generated at build time from the same data as the pages, so every challenge
// page is listed and the list cannot drift. Built to dist/sitemap.xml (no client or Worker
// code). URLs are absolute, without trailing slash (see `trailingSlash` in astro.config.mjs);
// the 404 page is not indexable and is left out. Referenced from public/robots.txt.
import type { APIRoute } from "astro";
import { challengeDirectory } from "../data/challenge-directory";

const paths = ["/", "/challenges", "/about", ...challengeDirectory.map(({ slug }) => `/challenges/${slug}`)];

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("`site` must be set in astro.config.mjs to build the sitemap");
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site).href}</loc></url>`).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
