import { NextRequest, NextResponse } from "next/server";
import {
  listKnownDocIds,
  matchClientForTitle,
  createMeetingNote,
} from "@/lib/db/meetingNotes";
import { createTodo } from "@/lib/db/todos";
import { extractMeetingNotesSummaryAndTodos } from "@/lib/anthropic";

// Fired by a Zap: "New file in folder" (Meet Recordings) -> a step that
// reads the Doc's text -> Webhooks by Zapier POSTs here. Zapier holds the
// Google auth (her already-connected account), so this app never talks to
// the Google API directly — sidesteps the service-account/Drive-API setup
// that caused problems before (V2-BUILD-SPEC.md Phase 12, revised after
// the direct-API approach was tried and reverted this session).
//
// Bearer-token protected the same way the invoice cron protects itself
// with CRON_SECRET, per the spec's own suggested pattern — but a separate
// secret, since this is an external webhook, not an internal cron.
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.MEETING_NOTES_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const docId = typeof body?.docId === "string" ? body.docId : "";
  const docTitle = typeof body?.docTitle === "string" ? body.docTitle : "";
  const docUrl = typeof body?.docUrl === "string" ? body.docUrl : "";
  const content = typeof body?.content === "string" ? body.content : "";

  if (!docId || !docTitle || !docUrl || !content) {
    return NextResponse.json(
      { error: "docId, docTitle, docUrl, and content are required." },
      { status: 400 }
    );
  }

  // Zapier can redeliver on retry — guard against creating a duplicate row
  // for the same Doc.
  const knownDocIds = await listKnownDocIds();
  if (knownDocIds.has(docId)) {
    return NextResponse.json({ ok: true, skipped: "already processed" });
  }

  const { client, ambiguous } = await matchClientForTitle(docTitle);

  // Most of the shared Meet Recordings folder isn't an In Control call at
  // all (100 Minute Bet, general intro calls, etc.) — zero matches is the
  // normal case, not an error, so it's skipped silently rather than
  // creating a "Needs matching" row for every unrelated call.
  if (!client && !ambiguous) {
    return NextResponse.json({ ok: true, skipped: "no matching client" });
  }

  const extraction = await extractMeetingNotesSummaryAndTodos(content).catch(() => null);

  const note = await createMeetingNote({
    clientId: client?.id ?? null,
    docId,
    docUrl,
    docTitle,
    rawContent: content,
    summary: extraction?.summary ?? null,
    matchStatus: client ? "Matched" : "Needs matching",
  });

  if (extraction) {
    for (const text of extraction.todos) {
      await createTodo(note.id, text);
    }
  }

  return NextResponse.json({ ok: true, meetingNoteId: note.id, matched: Boolean(client) });
}
