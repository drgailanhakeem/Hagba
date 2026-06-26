// ─── Note HTML sanitization (server-side) ────────────────────────────────────
// The note body is stored as raw HTML produced by the TipTap editor. When it is
// rendered on the public, unauthenticated share page via dangerouslySetInnerHTML
// we cannot trust it: a user can write arbitrary HTML to their own note row
// through the Supabase API (RLS only checks ownership, not content shape) and
// then make it public. Sanitizing here strips scripts, event handlers and unsafe
// URLs before the markup ever reaches a visitor's browser.
//
// `sanitize-html` runs on htmlparser2 (no DOM/jsdom needed), so this is safe to
// call from a Server Component.

import sanitizeHtml from "sanitize-html"

// Tags the editor can emit: headings, paragraphs, marks, lists (incl. task
// lists), code blocks, blockquotes, rules, and hashtag spans.
const ALLOWED_TAGS = [
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "s", "del", "u", "mark", "code",
  "pre", "blockquote",
  "ul", "ol", "li",
  "span", "a",
]

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    // class drives prose / code-block / task-item / hashtag styling.
    "*": ["class"],
    // Task-list items carry their checked state as data attributes.
    li: ["class", "data-type", "data-checked"],
    ul: ["class", "data-type"],
    // Hashtag marks are rendered as spans with data attributes.
    span: ["class", "data-type", "data-label", "data-tag"],
    // Links: only the href, restricted to safe schemes below.
    a: ["href", "rel", "target"],
    // Code blocks tag their language via the class (e.g. "language-ts").
    code: ["class"],
    pre: ["class"],
  },
  // Block javascript:, data: and other dangerous URL schemes outright.
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  // Force any link that survives to be safe to open from another origin.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
  },
  // Drop the contents of these entirely rather than just unwrapping the tag.
  nonTextTags: ["style", "script", "textarea", "noscript"],
}

/** Sanitize stored note HTML for safe rendering on the public share page. */
export function sanitizeNoteHtml(html: string): string {
  if (!html) return "<p></p>"
  const clean = sanitizeHtml(html, sanitizeOptions).trim()
  return clean || "<p></p>"
}
