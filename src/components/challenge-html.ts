// Render-time touch-ups for the partner wording in src/data/challenge-text/. The JSON files stay
// 1:1 with their sources, so a re-import gives the same result; everything here only changes how
// that wording is shown, never the words. A section that needs no touch-up is returned unchanged.

// Splits an HTML fragment into tags (odd indexes) and the text between them (even indexes).
const TAG = /(<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>)/;
const tagName = (tag: string) => /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(tag)?.[1].toLowerCase();
const isClosing = (tag: string) => tag.startsWith("</");

// A paired Markdown bold marker, `**words**`, as some partners typed it into plain-text fields.
const BOLD = /\*\*(?=\S)([^*]+?)(?<=\S)\*\*/g;
// A paragraph that holds only a Markdown heading marker and a title, `###Title` or `### Title`.
const HEADING_MARKER = /^\s*(#{2,6})(?!#)\s*(\S[^\n]*?)\s*$/;

/**
 * Shows Markdown that partners typed into plain-text fields as the formatting it stands for:
 * `**x**` becomes <strong>x</strong>, and a paragraph that is only `###Title` becomes a heading
 * of that level. Nothing inside <pre> or <code> is touched.
 */
export function formatMarkdownMarkers(html: string): string {
  if (!html.includes("**") && !html.includes("#")) return html;
  const parts = html.split(TAG);
  let literal = 0; // depth of <pre>/<code>
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      const name = tagName(parts[i]);
      if (name === "pre" || name === "code") literal = Math.max(0, literal + (isClosing(parts[i]) ? -1 : 1));
      continue;
    }
    if (literal > 0) continue;
    const heading = HEADING_MARKER.exec(parts[i]);
    if (heading && tagName(parts[i - 1] ?? "") === "p" && !isClosing(parts[i - 1]) && parts[i + 1] === "</p>") {
      const level = heading[1].length;
      parts[i - 1] = `<h${level}>`;
      parts[i] = heading[2];
      parts[i + 1] = `</h${level}>`;
      continue;
    }
    parts[i] = parts[i].replace(BOLD, "<strong>$1</strong>");
  }
  return parts.join("");
}

/** The same words without the Markdown bold markers, for plain-text summaries such as cards. */
export function stripMarkdownMarkers(text: string): string {
  return text.replace(BOLD, "$1");
}
