import Link from "next/link";
import { MeetingNote } from "@/lib/db/meetingNotes";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MeetingNotesCard({
  clientId,
  meetingNotes,
}: {
  clientId: string;
  meetingNotes: MeetingNote[];
}) {
  return (
    <div className="admin-card p-6">
      <h2 className="mb-2 font-heading font-[800] text-lg">Meeting notes</h2>
      <p className="mb-4 text-sm text-[#0a0608]/60">
        Pulled automatically from Google Meet call notes, matched to this client by name.
      </p>
      {meetingNotes.length === 0 && (
        <p className="text-sm text-[#0a0608]/50">None yet.</p>
      )}
      {meetingNotes.length > 0 && (
        <ul className="space-y-3">
          {meetingNotes.map((note) => (
            <li key={note.id} className="text-sm">
              <a href={note.docUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                {formatDate(note.createdAt)}
              </a>
              {note.summary && <p className="mt-0.5 text-[#0a0608]/60">{note.summary}</p>}
              <Link
                href={`/admin/clients/${clientId}/meeting-notes/${note.id}/recap`}
                className="mt-1 inline-block text-xs text-[#0a0608]/50 underline"
              >
                {note.recapSlug ? "Edit recap" : "Generate recap"}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
