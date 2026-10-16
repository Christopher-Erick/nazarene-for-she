/** Search results show about 155 characters: cut at a word and add an ellipsis if longer. */
export function fitDescription(text: string, max = 155) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s—-]+$/, "")}…`;
}
