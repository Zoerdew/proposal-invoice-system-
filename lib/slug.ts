import { getProposalBySlug } from "./airtable";

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "proposal";
}

// Appends -2, -3, ... until it finds a slug not already in use by a
// different proposal. currentProposalId lets an edit keep its own slug.
export async function ensureUniqueSlug(
  base: string,
  currentProposalId?: string
): Promise<string> {
  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await getProposalBySlug(candidate);
    if (!existing || existing.id === currentProposalId) return candidate;
    candidate = `${base}-${n}`;
    n++;
  }
}
