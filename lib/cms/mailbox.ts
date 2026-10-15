export type EmailAddress = { email: string; name?: string };

/** Accepts "Name <email@x.org>" or a bare address. */
export function parseMailbox(value: string): EmailAddress | null {
  const text = value.trim();
  const match = text.match(/^(.*)<([^<>\s]+@[^<>\s]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, "");
    return name ? { email: match[2], name } : { email: match[2] };
  }
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text) ? { email: text } : null;
}
