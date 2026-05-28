// Strip all HTML tags, returning plain text only.
// React auto-escapes on render; this is a belt-and-suspenders defense before DB writes.
export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}
