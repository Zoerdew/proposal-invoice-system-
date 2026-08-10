import { NextRequest, NextResponse } from "next/server";
import { getMeetingNoteByRecapSlug } from "@/lib/db/meetingNotes";
import { listTodosForMeetingNote, toggleTodo } from "@/lib/db/todos";

// Not behind the Phase 14 portal login — same reasoning as Phase 11's
// call proposals: an unlisted, noindex slug is the access model here,
// matching how the reference recap page itself works (no login, just
// the link).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const { slug, id } = await params;
  const note = await getMeetingNoteByRecapSlug(slug);
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const noteTodos = await listTodosForMeetingNote(note.id);
  if (!noteTodos.some((t) => t.id === id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.done !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const todo = await toggleTodo(id, body.done);
  return NextResponse.json(todo);
}
