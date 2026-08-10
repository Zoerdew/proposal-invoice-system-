import { listNeedsMatching } from "@/lib/db/meetingNotes";
import { listClientsAdmin } from "@/lib/db/clients";
import MatchToClientForm from "./MatchToClientForm";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// No nav entry — this should almost always be empty. A meeting note only
// lands here when its Doc title genuinely matches more than one real
// client by name; most of the shared Meet Recordings folder isn't an In
// Control call at all and is skipped without ever reaching this table.
export default async function NeedsMatchingPage() {
  const [notes, clients] = await Promise.all([listNeedsMatching(), listClientsAdmin()]);

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">Meeting notes needing a match</h1>
      <p className="mb-6 text-sm text-[#0a0608]/60">
        A Doc title matched more than one real client by name — pick the right one.
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
