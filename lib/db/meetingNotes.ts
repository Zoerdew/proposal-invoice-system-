import { db } from "./client";
import { listClientsAdmin, AdminClient } from "./clients";

export interface MeetingNote {
  id: string;
  clientId: string | null;
  docId: string;
  docUrl: string;
  docTitle: string;
  rawContent: string;
  summary: string | null;
  matchStatus: string;
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
