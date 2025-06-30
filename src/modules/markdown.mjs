import { marked } from "marked";
import DOMPurify from "dompurify";
import markedAlert from "marked-alert";
import { markedEmoji } from "marked-emoji";
import emojis from "./emojis.mjs";

// Configure marked for GitHub-flavored markdown
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
});
// Use our emojis lib
marked.use(
  markedEmoji({
    emojis,
    renderer: (token) => token.emoji,
  })
);

marked.use(markedAlert());

function markdownParse(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  try {
    // Parse markdown using marked
    const htmlContent = marked.parse(text);

    // Sanitize the HTML to prevent XSS attacks
    const cleanHtml = DOMPurify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "div",
        "span",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "del",
        "s",
        "ul",
        "ol",
        "li",
        "a",
        "code",
        "pre",
        "blockquote",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "hr",
        "img",
      ],
      ALLOWED_ATTR: [
        "href",
        "target",
        "rel",
        "class",
        "src",
        "alt",
        "title",
        "colspan",
        "rowspan",
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    });

    return cleanHtml;
  } catch (error) {
    console.error("Error formatting markdown:", error);
    return `Error formatting markdown: ${error.message}`;
  }
}

export { marked, markdownParse };
