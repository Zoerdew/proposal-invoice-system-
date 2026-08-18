import { listNeedsMatching } from "@/lib/db/meetingNotes";
import { listClientsAdmin } from "@/lib/db/clients";
import MatchToClientForm from "./MatchToClientForm";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// No nav entry. Every meeting note whose Doc title doesn't resolve to exactly
// one client lands here — no match as well as several. Unmatched Docs used to
// be dropped at the webhook, which lost real calls whose title didn't happen
// to contain a client's full name. The shared Meet Recordings folder does
// carry calls that aren't In Control work, so this table is expected to hold
// some rows worth ignoring rather than being empty.
export default async function NeedsMatchingPage() {
  const [notes, clients] = await Promise.all([listNeedsMatching(), listClientsAdmin()]);

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">Meeting notes needing a match</h1>
      <p className="mb-6 text-sm text-[#0a0608]/60">
        A Doc title didn&apos;t resolve to one client, either because nothing
        matched or because several did. Pick the right client, or leave anything
        that isn&apos;t an In Control call.
      </p>

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Date</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>
            {notes.map((note) => (
              <tr key={note.id}>
                <td>
                  <a href={note.docUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                    {note.docTitle}
                  </a>
                </td>
                <td>{formatDate(note.createdAt)}</td>
                <td>
                  <MatchToClientForm
                    meetingNoteId={note.id}
                    clients={clients.map((c) => ({ id: c.id, name: c.name }))}
                  />
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-[#0a0608]/50 py-6">
                  Nothing needs matching right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
