// Import a saved partner challenge page without paraphrasing its content.
// Usage: node scripts/import-challenge.mjs SOURCE.html EXISTING-CHALLENGE-SLUG
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import { select, selectAll } from "hast-util-select";
import { toString } from "hast-util-to-string";

const parser = unified().use(rehypeParse);
const normalize = (text) => text.replace(/\s+/g, " ").trim();
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const allowed = new Set("p div span h1 h2 h3 h4 h5 h6 ul ol li blockquote pre code strong em b i u s del a br hr table thead tbody tfoot tr td th sub sup kbd".split(" "));
const drop = new Set(["script", "style", "svg", "button", "input", "iframe", "template", "noscript"]);

/** Keep semantic content and safe links, dropping dashboard styling and active code. */
function html(node) {
  if (node.type === "text") return escape(node.value);
  if (node.type !== "element" || drop.has(node.tagName)) return "";
  const children = node.children.map(html).join("");
  if (!allowed.has(node.tagName)) return children;
  // The page title is h1 and source section headings are h2. Nest body headings below them.
  const tag = /^h[1-6]$/.test(node.tagName) ? `h${Math.min(6, Math.max(3, Number(node.tagName[1]) + 1))}` : node.tagName;
  let attributes = "";
  if (tag === "a") {
    const href = String(node.properties.href ?? "");
    assert.match(href, /^(https?:\/\/|mailto:)/i, `Unsupported source link: ${href}`);
    attributes = ` href="${escape(href)}"`;
  }
  if (tag === "ol" && node.properties.start) attributes = ` start="${Number(node.properties.start)}"`;
  if (["td", "th"].includes(tag)) {
    for (const [property, attribute] of [["colSpan", "colspan"], ["rowSpan", "rowspan"]]) {
      if (node.properties[property]) attributes += ` ${attribute}="${Number(node.properties[property])}"`;
    }
  }
  return ["br", "hr"].includes(tag) ? `<${tag}${attributes}>` : `<${tag}${attributes}>${children}</${tag}>`;
}

const links = (node) => selectAll("a", node).map((a) => [a.properties.href, toString(a)]);

export function extractChallenge(source) {
  const document = parser.parse(source);
  const main = select("main", document);
  assert(main, "Source must contain the challenge main element");
  const title = select("h1", main);
  assert(title, "Source must contain a challenge title");
  const sections = selectAll("section", main).filter((section) => select(":scope > header > h2", section));
  assert(sections.length >= 3, "Expected the challenge, company and prize sections");
  const company = sections.find((section) => toString(select(":scope > header > p", section) ?? { type: "text", value: "" }) === "Company Info");
  assert(company, "Source must include Company Info");
  const companyName = toString(select(":scope > header > h2", company));
  const sourceSections = sections.map((section) => {
    const header = select(":scope > header", section);
    const heading = toString(select("h2", header));
    const eyebrow = select("p", header);
    const body = { type: "root", children: section.children.filter((child) => child !== header) };
    const content = body.children.map(html).join("").trim();
    const clean = parser.parse(content);
    // All words, punctuation and hyperlinks must survive sanitizing unchanged.
    assert.equal(normalize(toString(clean)), normalize(toString(body)), `Text changed in ${heading}`);
    assert.deepEqual(links(clean), links(body), `Links changed in ${heading}`);
    return {
      title: heading,
      ...(eyebrow ? { eyebrow: toString(eyebrow) } : {}),
      html: content,
      sidebar: Boolean(eyebrow) || heading === "Judging Criteria" || heading === "Prizes",
    };
  });
  const first = parser.parse(sourceSections[0].html);
  const summary = select("p,h1,h2,h3,h4", first);
  assert(summary, "Expected a challenge summary");
  const prizeSection = sourceSections.find((section) => section.title === "Prizes");
  assert(prizeSection, "Expected prizes");
  const prizeTree = parser.parse(prizeSection.html);
  const prizes = selectAll("li", prizeTree).map((li) => li.children.map((child) => normalize(toString(child))).filter(Boolean).join(": ")).join(" · ");
  assert(prizes, "Expected prize entries");
  return { title: toString(title), org: companyName, task: normalize(toString(summary)), prizes, sections: sourceSections };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [sourceFile, slug] = process.argv.slice(2);
  assert(sourceFile && slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), "Usage: node scripts/import-challenge.mjs SOURCE.html EXISTING-CHALLENGE-SLUG");
  const challenge = extractChallenge(await readFile(sourceFile, "utf8"));
  const destination = new URL(`../src/data/challenge-text/${slug}.json`, import.meta.url);
  await writeFile(destination, `${JSON.stringify(challenge, null, 2)}\n`);
  console.log(`${challenge.org}: ${challenge.title} (${challenge.sections.length} complete sections)`);
}
