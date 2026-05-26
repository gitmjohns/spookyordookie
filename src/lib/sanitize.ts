import DOMPurify from "isomorphic-dompurify";

// Strip all HTML tags and attributes, returning plain text only.
// Used server-side before any user-submitted free-text is written to the DB.
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
