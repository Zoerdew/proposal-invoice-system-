import { notFound } from "next/navigation";
import { getMeetingNoteByRecapSlug } from "@/lib/db/meetingNotes";
import { listTodosForMeetingNote } from "@/lib/db/todos";
import { getClientAdmin } from "@/lib/db/clients";
import RecapTodoList from "@/components/recap/RecapTodoList";

export const metadata = {
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function RecapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getMeetingNoteByRecapSlug(slug);
  if (!note || !note.recapSlug) notFound();

  const [todos, client] = await Promise.all([
    listTodosForMeetingNote(note.id),
    note.clientId ? getClientAdmin(note.clientId).catch(() => null) : Promise.resolve(null),
  ]);

  const firstName = client?.firstName || client?.name || "there";

  return (
    <div className="min-h-screen bg-blush">
      <main className="max-w-3xl mx-auto w-full px-8 py-16">
        <div className="flex flex-col items-start gap-4 mb-10">
          <span className="eyebrow-pill">Call recap</span>
          <h1 className="font-heading font-[800] text-4xl md:text-5xl leading-[0.98] tracking-[-0.03em]">
            {firstName}, here&apos;s what <span className="text-accent">we covered</span>.
          </h1>
          <p className="text-sm text-[#0a0608]/50">{formatDate(note.createdAt)}</p>
        </div>

        {note.summary && (
          <div className="card-brutal p-8 mb-10">
            <p className="admin-label mb-2 block text-[#0a0608]/50">The short version</p>
            <p className="text-base leading-relaxed">{note.summary}</p>
          </div>
        )}

        {note.decisions && note.decisions.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading font-[800] text-2xl mb-4">Decisions</h2>
            <ul className="space-y-3">
              {note.decisions.map((decision, i) => (
                <li key={i} className="card-brutal-blush p-4 text-sm">
                  {decision}
                </li>
              ))}
            </ul>
          </div>
        )}

        {note.details && note.details.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading font-[800] text-2xl mb-4">What we covered</h2>
            <div className="space-y-6">
              {note.details.map((detail, i) => (
                <div key={i} className="flex gap-4">
                  <div className="step-badge step-badge-done shrink-0">{i + 1}</div>
                  <div>
                    <p className="admin-label mb-1 block text-[#0a0608]/50">{detail.label}</p>
                    <p className="font-heading font-[800] text-lg mb-1">{detail.title}</p>
                    <p className="text-sm leading-relaxed text-[#0a0608]/80">{detail.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {todos.length > 0 && (
          <div className="mb-10">
            <h2 className="font-heading font-[800] text-2xl mb-4">Next steps</h2>
            <RecapTodoList slug={slug} initialTodos={todos} />
          </div>
        )}

        <p className="text-sm text-[#0a0608]/50">Zx</p>
      </main>
    </div>
  );
}
