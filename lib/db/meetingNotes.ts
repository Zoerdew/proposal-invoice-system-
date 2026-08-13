import { db } from "./client";
import { listClientsAdmin, AdminClient } from "./clients";
import { slugify } from "../slug";
import type { Database } from "./types";

export interface RecapDetail {
  label: string;
  title: string;
  body: string;
}

export interface MeetingNote {
  id: string;
  clientId: string | null;
  docId: string;
  docUrl: string;
  docTitle: string;
  rawContent: string;
  summary: string | null;
  matchStatus: string;
  decisions: string[] | null;
  details: RecapDetail[] | null;
  recapSlug: string | null;
  recapPublishedAt: string | null;
  recapSummary: string | null;
  recapFocus: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNoteInput {
  clientId: string | null;
  docId: string;
  docUrl: string;
  docTitle: string;
  rawContent: string;
  summary: string | null;
  matchStatus: "Matched" | "Needs matching";
}

type MeetingNoteRow = {
  id: string;
  client_id: string | null;
  doc_id: string;
  doc_url: string;
  doc_title: string;
  raw_content: string;
  summary: string | null;
  match_status: string;
  decisions: unknown;
  details: unknown;
  recap_slug: string | null;
  recap_published_at: string | null;
  recap_summary: string | null;
  recap_focus: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

function toMeetingNote(row: MeetingNoteRow): MeetingNote {
  return {
    id: row.id,
    clientId: row.client_id,
    docId: row.doc_id,
    docUrl: row.doc_url,
    docTitle: row.doc_title,
    rawContent: row.raw_content,
    summary: row.summary,
    matchStatus: row.match_status,
    decisions: Array.isArray(row.decisions) ? (row.decisions as string[]) : null,
    details: Array.isArray(row.details) ? (row.details as RecapDetail[]) : null,
    recapSlug: row.recap_slug,
    recapPublishedAt: row.recap_published_at,
    recapSummary: row.recap_summary,
    recapFocus: row.recap_focus,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listKnownDocIds(): Promise<Set<string>> {
  const { data, error } = await db().from("meeting_notes").select("doc_id");
  if (error) throw error;
  return new Set(data.map((row) => row.doc_id));
}

export async function listMeetingNotesForClient(clientId: string): Promise<MeetingNote[]> {
  const { data, error } = await db()
    .from("meeting_notes")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toMeetingNote);
}

export async function listNeedsMatching(): Promise<MeetingNote[]> {
  const { data, error } = await db()
    .from("meeting_notes")
    .select("*")
    .eq("match_status", "Needs matching")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toMeetingNote);
}

export async function createMeetingNote(input: MeetingNoteInput): Promise<MeetingNote> {
  const { data, error } = await db()
    .from("meeting_notes")
    .insert({
      client_id: input.clientId,
      doc_id: input.docId,
      doc_url: input.docUrl,
      doc_title: input.docTitle,
      raw_content: input.rawContent,
      summary: input.summary,
      match_status: input.matchStatus,
    })
    .select()
    .single();
  if (error) throw error;
  return toMeetingNote(data);
}

export async function matchMeetingNoteToClient(id: string, clientId: string): Promise<void> {
  const { error } = await db()
    .from("meeting_notes")
    .update({ client_id: clientId, match_status: "Matched" })
    .eq("id", id);
  if (error) throw error;
}

// Full-name substring match against real clients only — the shared "Meet
// Recordings" Drive folder holds calls from Zoë's whole business (100
// Minute Bet, general intro calls, etc.), not just In Control, so a doc
// title matching zero clients is expected and normal, not an error.
// Returns the single matching client, or null for zero or 2+ matches —
// callers treat 2+ as "Needs matching" (genuine ambiguity worth a manual
// look), zero as "not an In Control call, skip silently".
export async function matchClientForTitle(
  title: string
): Promise<{ client: AdminClient | null; ambiguous: boolean }> {
  const clients = await listClientsAdmin();
  const lowerTitle = title.toLowerCase();
  const matches = clients.filter(
    (c) => c.name.trim() && lowerTitle.includes(c.name.trim().toLowerCase())
  );

  if (matches.length === 1) return { client: matches[0], ambiguous: false };
  if (matches.length > 1) return { client: null, ambiguous: true };
  return { client: null, ambiguous: false };
}

async function recapSlugExists(slug: string): Promise<boolean> {
  const { data, error } = await db()
    .from("meeting_notes")
    .select("id")
    .eq("recap_slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data != null;
}

// Not reusing lib/slug.ts's ensureUniqueSlug (hardcoded to proposals) or
// callProposals.ts's local equivalent (hardcoded to call_proposals) — same
// reasoning as Phase 11, not worth generalising a shared util for one more
// caller.
async function ensureUniqueRecapSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await recapSlugExists(candidate)) {
    candidate = `${base}-${n}`;
    n++;
  }
  return candidate;
}

export async function getMeetingNote(id: string): Promise<MeetingNote> {
  const { data, error } = await db().from("meeting_notes").select("*").eq("id", id).single();
  if (error) throw error;
  return toMeetingNote(data);
}

export async function getMeetingNoteByRecapSlug(slug: string): Promise<MeetingNote | null> {
  const { data, error } = await db()
    .from("meeting_notes")
    .select("*")
    .eq("recap_slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toMeetingNote(data) : null;
}

// Publishing enriches and exposes the existing row rather than creating a
// parallel entity — next-steps are already the todos tied to this note's
// id (Phase 12), so all a recap adds is decisions/details plus the slug
// that makes it publicly reachable.
export async function publishRecap(
  id: string,
  input: { decisions: string[]; details: RecapDetail[]; shortVersion: string; focus: string }
): Promise<MeetingNote> {
  const note = await getMeetingNote(id);
  const baseSlug = slugify(note.docTitle.replace(/-\s*Notes by Gemini$/i, "").trim());
  const slug = note.recapSlug ?? (await ensureUniqueRecapSlug(baseSlug));

  const { data, error } = await db()
    .from("meeting_notes")
    .update({
      decisions: input.decisions,
      // RecapDetail[] isn't structurally a Json[] to TS (no index
      // signature) even though it serialises fine — same shape mismatch
      // as any plain interface stored in a jsonb column.
      details: input.details as unknown as Database["public"]["Tables"]["meeting_notes"]["Update"]["details"],
      recap_slug: slug,
      recap_published_at: new Date().toISOString(),
      recap_summary: input.shortVersion,
      recap_focus: input.focus,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toMeetingNote(data);
}

// Sets confirmed_at unconditionally — callers check note.confirmedAt first
// so a second click doesn't overwrite the original confirmation time or
// re-send Zoë's notification email.
export async function confirmRecap(id: string): Promise<MeetingNote> {
  const { data, error } = await db()
    .from("meeting_notes")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toMeetingNote(data);
}
