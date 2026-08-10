import { notFound } from "next/navigation";
import Link from "next/link";
import { getMeetingNote } from "@/lib/db/meetingNotes";
import RecapGenerator from "./RecapGenerator";

export const dynamic = "force-dynamic";

export default async function MeetingNoteRecapPage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>;
}) {
  const { id, noteId } = await params;

  let note;
  try {
    note = await getMeetingNote(noteId);
  } catch {
    notFound();
  }

  return (
    <div>
      <Link href={`/admin/clients/${id}`} className="mb-4 inline-block text-sm text-accent underline">
        ← Back to client
      </Link>
      <h1 className="mb-6 font-heading font-[800] text-xl">
        Recap — {note.docTitle}
      </h1>
      <RecapGenerator
        meetingNoteId={noteId}
        initialDecisions={note.decisions}
        initialDetails={note.details}
        initialRecapSlug={note.recapSlug}
      />
    </div>
  );
}
