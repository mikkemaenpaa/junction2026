// Build-time Astro integration: writes a Markdown twin of every built HTML page, and
// llms-full.txt, after `astro build` (the `astro:build:done` hook). Nothing here runs in the
// browser or on Cloudflare; the output is plain static files in dist/.
//
//   dist/index.html             -> dist/index.md            (served at /index.md)
//   dist/about.html             -> dist/about.md            (served at /about.md)
//   dist/challenges/<slug>.html -> dist/challenges/<slug>.md
//
// Every twin is converted from the page's own <main>, so a new page gets one without any
// Markdown being written by hand. The 404 page has none. Each page must declare its twin with
// <link rel="alternate" type="text/markdown"> (src/layouts/BaseLayout.astro), and every twin
// must be listed in dist/llms.txt (src/pages/llms.txt.ts); the build fails otherwise, so the
// three cannot drift apart. llms-full.txt is all twins in llms.txt order, in one file.
//
// The pages are built from cards, logos and collapsible sections that read badly as raw
// Markdown, so the HTML is reshaped before conversion (see `reshape`): decorative and hidden
// elements are dropped, whole-card links become a linked heading plus plain text, <details> are
// expanded, rows of links become lists, and all links are made absolute URLs of the normal
// (HTML) pages. The result is checked for leftover HTML, empty or relative links before it is
// written.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { select, selectAll } from "hast-util-select";
import { toString } from "hast-util-to-string";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

/** Built HTML files (relative to dist/) that get no Markdown twin. */
const NO_TWIN = new Set(["404.html", "500.html"]);

/** Elements that carry no content worth reading as text. */
const DROP_TAGS = new Set([
  "script", "style", "template", "noscript", "svg", "img", "picture", "video", "audio", "iframe",
  "canvas", "nav", "button", "form", "input", "select", "textarea",
]);
const HEADINGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HEADING_SELECTOR = HEADINGS.join(",");
const BLOCK_TAGS = new Set([
  "address", "article", "aside", "blockquote", "details", "dd", "div", "dl", "dt", "figcaption",
  "figure", "footer", "header", "hgroup", "hr", "li", "main", "ol", "p", "pre", "section",
  "summary", "table", "ul", ...HEADINGS,
]);
/** Blocks kept whole when a card is flattened. */
const LEAF_BLOCK_TAGS = new Set<string>(["p", "ul", "ol", "blockquote", "pre", "table", "dl", ...HEADINGS]);
/** Arrows the site appends to link labels ("View challenge →", "hostinger.com ↗"). */
const ARROWS = /^[\s←→↗↘↖↙↑↓︎️]+|[\s←→↗↘↖↙↑↓︎️]+$/g;

type Parent = Root | Element;
type Visitor = (node: ElementContent) => ElementContent[] | undefined;

// With tag names, the type guard is `Element & { tagName: T }`, so a false result does not rule
// out other elements.
const isEl = <T extends string>(node: unknown, ...tags: T[]): node is Element & { tagName: T } =>
  (node as Element | undefined)?.type === "element" && (tags.length === 0 || (tags as string[]).includes((node as Element).tagName));
const isBlock = (node: unknown): boolean => isEl(node) && BLOCK_TAGS.has(node.tagName);
const isHeading = (node: unknown) => isEl(node, ...HEADINGS);
const hasBlockDescendant = (el: Element): boolean => el.children.some((c) => isBlock(c) || (isEl(c) && hasBlockDescendant(c)));
const textOf = (node: Root | ElementContent) => toString(node).replace(/\s+/g, " ").trim();
const isBlank = (node: ElementContent) => node.type === "comment" || (node.type === "text" && !node.value.trim());
const classList = (el: Element) => (Array.isArray(el.properties.className) ? el.properties.className.map(String) : []);
const el = (tagName: string, children: ElementContent[], properties: Element["properties"] = {}): Element => ({
  type: "element", tagName, properties, children,
});
const txt = (value: string): Text => ({ type: "text", value });
const elementChildren = (parent: Parent) => (parent.children as RootContent[]).filter((c): c is Element => c.type === "element");

/** Pre-order rewrite: the visitor returns replacement nodes (not revisited) or undefined to keep and descend. */
function rewrite(parent: Parent, visit: Visitor) {
  const out: ElementContent[] = [];
  for (const child of parent.children as ElementContent[]) {
    const replacement = visit(child);
    if (replacement) out.push(...replacement);
    else {
      if (child.type === "element") rewrite(child, visit);
      out.push(child);
    }
  }
  parent.children = out;
}

/** Post-order rewrite: children are rewritten before their parent is visited. */
function rewriteUp(parent: Parent, visit: Visitor) {
  const out: ElementContent[] = [];
  for (const child of parent.children as ElementContent[]) {
    if (child.type === "element") rewriteUp(child, visit);
    out.push(...(visit(child) ?? [child]));
  }
  parent.children = out;
}

/** Removes `target` from the tree under `parent`. */
function detach(parent: Parent, target: Element): boolean {
  const i = parent.children.indexOf(target);
  if (i >= 0) {
    parent.children.splice(i, 1);
    return true;
  }
  return elementChildren(parent).some((c) => detach(c, target));
}

/** Drops elements that are empty once decoration is gone (e.g. a logo wrapper). */
const dropEmpty: Visitor = (node) =>
  isEl(node) && !["br", "hr"].includes(node.tagName) && !textOf(node) ? [] : undefined;

/**
 * Splits a block into its readable parts: paragraphs, lists and headings, with runs of inline
 * content wrapped in <p>. Used to flatten a card's nested layout <div>s.
 */
function leafBlocks(parent: Element): Element[] {
  const out: Element[] = [];
  let run: ElementContent[] = [];
  const flush = () => {
    if (run.some((n) => textOf(n))) out.push(el("p", run));
    run = [];
  };
  for (const child of parent.children) {
    if (child.type === "element" && isBlock(child)) {
      flush();
      if (LEAF_BLOCK_TAGS.has(child.tagName)) out.push(child);
      else if (!hasBlockDescendant(child)) out.push(el("p", child.children));
      else out.push(...leafBlocks(child));
    } else if (child.type === "element" || child.type === "text") run.push(child);
  }
  flush();
  return out.filter((block) => textOf(block));
}

/**
 * A card (an <article>, or an <a> wrapping a whole card) becomes: its heading first, with a
 * normal link on the title; then a one-line summary of the short labels (partner, track);
 * then the remaining text. Links that only repeat the title link ("View challenge") and a
 * partner name repeated as "By <name>" are dropped.
 */
function rebuildCard(card: Element): Element {
  const heading = selectAll(HEADING_SELECTOR, card)[0];
  if (!heading) {
    // A block link without a heading: keep its text, with the link on the first block.
    const blocks = leafBlocks(card);
    const first = blocks[0];
    if (first && card.tagName === "a") first.children = [el("a", first.children, { href: card.properties.href })];
    return el("div", blocks);
  }
  detach(card, heading);
  const href = card.tagName === "a" ? card.properties.href : select("a[href]", heading)?.properties.href;
  if (card.tagName === "a") heading.children = [el("a", heading.children, { href })];

  let blocks = leafBlocks(card).filter((block) => {
    const links = selectAll("a", block);
    const onlyTitleLink = links.length > 0 && links.every((a) => a.properties.href === href) &&
      textOf(block) === links.map(textOf).join(" ");
    return !onlyTitleLink;
  });
  const texts = blocks.map((b) => textOf(b).toLowerCase());
  blocks = blocks.filter((_, i) => !texts.includes(`by ${texts[i]}`));

  // Short labels before the main text ("Hostinger", "Agentic AI Track") share one line.
  const isLabel = (b: Element) => b.tagName === "p" && !select("a", b) && textOf(b).length <= 40 && !/[.!?]$/.test(textOf(b));
  let labels = 0;
  while (labels < blocks.length && isLabel(blocks[labels]!)) labels++;
  const summary = labels > 1 ? [el("p", [txt(blocks.slice(0, labels).map(textOf).join(" · "))])] : blocks.slice(0, labels);
  return el("div", [heading, ...summary, ...blocks.slice(labels)]);
}

/** Reshapes a page's <main> in place so it converts to clean Markdown. */
function reshape(main: Element, page: { url: URL; title: string }) {
  // 1. Decoration, hidden and interactive elements. Screen-reader-only text duplicates visible
  //    text, except a visually hidden heading (the home page's <h1>), which is kept.
  rewrite(main, (node) => {
    if (node.type === "comment") return [];
    if (!isEl(node)) return undefined;
    const p = node.properties;
    const srOnly = classList(node).includes("sr-only");
    if (DROP_TAGS.has(node.tagName) || p.ariaHidden === "true" || p.hidden || (srOnly && !isHeading(node) && !select(HEADING_SELECTOR, node))) return [];
    return undefined;
  });
  rewriteUp(main, dropEmpty);

  // 2. Text in adjacent styled <span>s would run together ("Prizes:1st"): separate them.
  rewriteUp(main, (node) => {
    if (!isEl(node)) return undefined;
    const out: ElementContent[] = [];
    node.children.forEach((child, i) => {
      out.push(child);
      const next = node.children[i + 1];
      if (!isEl(child, "span") || !next) return;
      if (isEl(next, "span")) out.push(txt(" — "));
      else if (next.type === "text" ? !/^\s/.test(next.value) : isEl(next)) out.push(txt(" "));
    });
    node.children = out;
    return undefined;
  });

  // 3. <details> fully expanded, with its <summary> as a heading.
  rewriteUp(main, (node) => {
    if (isEl(node, "summary")) {
      const headings = selectAll(HEADING_SELECTOR, node);
      return headings.length ? headings : [el("h3", node.children)];
    }
    if (isEl(node, "details")) return node.children;
    return undefined;
  });

  // 4. A heading's trailing count ("Challenges <span>38</span>") reads as "Challenges (38)".
  for (const heading of selectAll(HEADING_SELECTOR, main)) {
    const last = elementChildren(heading).at(-1);
    if (isEl(last, "span") && /^\d+$/.test(textOf(last))) last.children = [txt(`(${textOf(last)})`)];
  }

  // 5. A block holding only plain links (link rows, the partner list) becomes a list.
  rewriteUp(main, (node) => {
    if (!isEl(node, "div", "p")) return undefined;
    const kids = elementChildren(node);
    const onlyLinks = kids.length > 0 && kids.every((k) => isEl(k, "a") && !hasBlockDescendant(k)) &&
      node.children.every((c) => c.type === "element" || isBlank(c));
    return onlyLinks ? [el("ul", kids.map((a) => el("li", [a])))] : undefined;
  });

  // 6. Cards: whole-card links and <article>s.
  rewrite(main, (node) => {
    if (isEl(node, "a") && hasBlockDescendant(node)) return [rebuildCard(node)];
    if (isEl(node, "article") && select(HEADING_SELECTOR, node)) return [rebuildCard(node)];
    return undefined;
  });

  // 7. Rows of plain-text <div>s (the schedule) become a list.
  rewriteUp(main, (node) => {
    if (!isEl(node, "div", "section")) return undefined;
    const kids = elementChildren(node);
    const rows = kids.length >= 2 && kids.every((k) => isEl(k, "div") && !hasBlockDescendant(k)) &&
      node.children.every((c) => c.type === "element" || isBlank(c));
    return rows ? [el("ul", kids.map((row) => el("li", row.children)))] : undefined;
  });

  // 8. Lists of sections (items with their own heading) are unwrapped into the sections.
  rewriteUp(main, (node) => {
    if (!isEl(node, "ul", "ol")) return undefined;
    const items = elementChildren(node);
    return items.some((li) => select(HEADING_SELECTOR, li)) ? items.flatMap((li) => li.children) : undefined;
  });

  // 9. An <aside> gets a heading from its leading label ("CHALLENGE PARTNER"), and loses text
  //    that repeats the main content (the prizes), together with that text's label.
  for (const aside of selectAll("aside", main)) {
    const first = leafBlocks(aside)[0];
    const label = first && textOf(first);
    if (isEl(first, "p") && label && label.length <= 40 && !select("a", first)) {
      const name = label === label.toUpperCase() ? label[0] + label.slice(1).toLowerCase() : label;
      (first as Element).tagName = "h2";
      first.children = [txt(name)];
    }
    // Full partner sections may intentionally repeat prizes or criteria from the brief.
    // They must keep every word; only the legacy summary sidebar needs deduplication.
    if (select(".challenge-prose", aside)) continue;
    const outside = structuredClone(main);
    for (const copy of selectAll("aside", outside)) detach(outside, copy);
    const seen = new Set(selectAll("p, li, div", outside).filter((n) => !hasBlockDescendant(n)).map(textOf));
    rewriteUp(aside, (node) => {
      if (!isEl(node)) return undefined;
      const kids = elementChildren(node);
      const repeat = kids.findIndex((k) => isEl(k, "p") && textOf(k).length >= 20 && seen.has(textOf(k)));
      if (repeat < 0) return undefined;
      const prev = kids[repeat - 1];
      const drop = new Set<Element>([kids[repeat]!]);
      if (repeat === kids.length - 1 && isEl(prev, "p") && textOf(prev).length <= 40) drop.add(prev);
      node.children = node.children.filter((c) => !drop.has(c as Element));
      return undefined;
    });
  }
  rewriteUp(main, dropEmpty);

  // 10. Eyebrow labels right above a heading are merged into it:
  //     "// Schedule" + "48 hours. One weekend." -> "Schedule: 48 hours. One weekend.", "01" + "Partner tracks" -> "1. Partner tracks".
  rewriteUp(main, (node) => {
    if (!isEl(node)) return undefined;
    const kids = elementChildren(node);
    const merged = new Set<Element>();
    kids.forEach((heading, i) => {
      const prev = kids[i - 1];
      if (!isHeading(heading) || heading.tagName === "h1" || !isEl(prev, "p") || select("a", prev)) return;
      const label = textOf(prev).replace(/^[\s/|·#>–—-]+/, "");
      if (!label || label.length > 40) return;
      heading.children = [txt(/^\d+$/.test(label) ? `${Number(label)}. ` : `${label}: `), ...heading.children];
      merged.add(prev);
    });
    if (merged.size) node.children = node.children.filter((c) => !merged.has(c as Element));
    return undefined;
  });

  // 11. The page starts with its <h1> (taken from <title> if the page has none). Lone links
  //     before it are back/breadcrumb navigation and are dropped; other text before it, such
  //     as an eyebrow line, follows it. A short line that only repeats the <h1> (the hero
  //     wordmark) is dropped.
  let h1 = select("h1", main);
  if (h1) {
    const before: Element[] = [];
    const walk = (parent: Element, inText: boolean): boolean => {
      for (const child of elementChildren(parent)) {
        if (child === h1) return true;
        if (isEl(child, "a") && !inText) before.push(child);
        if (walk(child, inText || isEl(child, "p", "li", ...HEADINGS))) return true;
      }
      return false;
    };
    walk(main, false);
    for (const link of [h1, ...before]) detach(main, link);
    const h1Text = textOf(h1).toLowerCase();
    let pastFirstSection = false;
    rewrite(main, (node) => {
      if (isEl(node, "h2")) pastFirstSection = true;
      if (pastFirstSection || !isEl(node, "p")) return undefined;
      const t = textOf(node).toLowerCase();
      return t && t.length <= 40 && h1Text.includes(t) ? [] : undefined;
    });
  } else {
    h1 = el("h1", [txt(page.title)]);
  }
  main.children.unshift(h1);

  // 12. Links: absolute URLs of the normal pages, labels without decorative arrows.
  rewriteUp(main, (node) => {
    if (!isEl(node, "a")) return undefined;
    const href = node.properties.href;
    const trim = (n: ElementContent | undefined) => {
      if (n?.type === "text") n.value = n.value.replace(ARROWS, "");
    };
    trim(node.children[0]);
    trim(node.children.at(-1));
    if (!textOf(node)) return [];
    if (typeof href !== "string" || !href) return node.children;
    node.properties = { href: new URL(href, page.url).href };
    return undefined;
  });
  rewriteUp(main, dropEmpty);
}

const toMarkdown = unified()
  .use(rehypeRemark)
  .use(remarkStringify, { bullet: "-", emphasis: "_", strong: "*", rule: "-", listItemIndent: "one", fences: true });

/** Problems an agent reading the Markdown would trip over; the build fails on any of them. */
function lint(md: string): string[] {
  const problems: string[] = [];
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "");
  if (!md.startsWith("---\ntitle: ")) problems.push("missing front matter");
  if (!/^\n> .+\n\n# \S/.test(body)) problems.push("does not start with the llms.txt note and an # H1");
  if (/<\/?[a-z][a-z0-9-]*(?=[\s>/])/i.test(body)) problems.push("leftover HTML tag");
  if (/\[\s*\]\(/.test(body)) problems.push("empty link text");
  if (/\]\(\s*\)/.test(body)) problems.push("empty link target");
  if (/\]\((?!https?:\/\/|mailto:)/.test(body)) problems.push("relative link");
  return problems;
}

/** dist-relative HTML file -> the page's path ("index.html" -> "/", "a/b.html" -> "/a/b"). */
const pagePath = (rel: string) => (rel === "index.html" ? "/" : `/${rel.replace(/\.html$/, "")}`);
/** Page path -> its twin's path ("/" -> "/index.md", "/about" -> "/about.md"). */
const markdownPath = (pathname: string) => (pathname === "/" ? "/index.md" : `${pathname.replace(/\/$/, "")}.md`);
const yamlString = (value: string) => JSON.stringify(value); // JSON strings are valid YAML.

async function listHtml(dir: string, base = ""): Promise<string[]> {
  const entries = await readdir(path.join(dir, base), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (e) => {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) return rel === "_astro" ? [] : listHtml(dir, rel);
    return e.name.endsWith(".html") ? [rel] : [];
  }));
  return nested.flat().sort();
}

export default function markdownTwins(): AstroIntegration {
  let site: URL | undefined;
  return {
    name: "markdown-twins",
    hooks: {
      "astro:config:done": ({ config }) => {
        if (!config.site) throw new Error("markdown-twins: `site` must be set in astro.config.mjs");
        site = new URL(config.site);
      },
      "astro:build:done": async ({ dir, logger }) => {
        if (!site) throw new Error("markdown-twins: site URL unknown");
        const dist = fileURLToPath(dir);
        const llmsUrl = new URL("/llms.txt", site).href;
        const twins = new Map<string, string>(); // twin URL -> Markdown
        const errors: string[] = [];

        for (const rel of (await listHtml(dist)).filter((f) => !NO_TWIN.has(f))) {
          const url = new URL(pagePath(rel), site);
          const twinUrl = new URL(markdownPath(url.pathname), site);
          const doc = unified().use(rehypeParse).parse(await readFile(path.join(dist, rel), "utf8"));
          const title = textOf(select("head > title", doc) ?? txt(""));
          const description = String(select('head > meta[name="description"]', doc)?.properties.content ?? "");
          const alternate = select('head > link[rel~="alternate"][type="text/markdown"]', doc)?.properties.href;
          const main = select("main", doc);
          if (alternate !== twinUrl.href) errors.push(`${rel}: <link rel="alternate" type="text/markdown"> must point to ${twinUrl.href} (found ${alternate ?? "none"})`);
          if (!title || !description) errors.push(`${rel}: <title> and <meta name="description"> are required`);
          if (!main) {
            errors.push(`${rel}: no <main> element to convert`);
            continue;
          }

          reshape(main, { url, title });
          const content = toMarkdown.stringify(await toMarkdown.run({ type: "root", children: [main] })).trim();
          const md = [
            "---",
            `title: ${yamlString(title)}`,
            `description: ${yamlString(description)}`,
            `url: ${url.href}`,
            "---",
            "",
            `> For the index of all pages on this site, see [llms.txt](${llmsUrl}).`,
            "",
            content,
            "",
          ].join("\n");
          for (const problem of lint(md)) errors.push(`${rel}: ${problem}`);
          twins.set(twinUrl.href, md);
          await writeFile(path.join(dist, twinUrl.pathname), md);
        }

        // llms.txt (src/pages/llms.txt.ts) must list every twin, and every same-site link in it
        // must be a built file. llms-full.txt follows its order.
        const llms = await readFile(path.join(dist, "llms.txt"), "utf8").catch(() => "");
        if (!llms) errors.push("dist/llms.txt is missing (src/pages/llms.txt.ts)");
        const links = [...llms.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => new URL(m[1]!)).filter((u) => u.origin === site!.origin);
        const listed = links.map((u) => u.href);
        for (const u of links) {
          if (u.pathname === "/llms-full.txt") continue;
          const exists = await readFile(path.join(dist, decodeURIComponent(u.pathname))).then(() => true, () => false);
          if (!exists) errors.push(`llms.txt links to ${u.href}, which is not a built file`);
        }
        for (const twin of twins.keys()) if (!listed.includes(twin)) errors.push(`llms.txt does not list ${twin}`);

        if (errors.length) throw new Error(`markdown-twins:\n  ${errors.join("\n  ")}`);

        const full = listed.filter((href, i) => twins.has(href) && listed.indexOf(href) === i).map((href) => twins.get(href)!);
        await writeFile(path.join(dist, "llms-full.txt"), full.join("\n"));
        logger.info(`${twins.size} Markdown twins and llms-full.txt written`);
      },
    },
  };
}
