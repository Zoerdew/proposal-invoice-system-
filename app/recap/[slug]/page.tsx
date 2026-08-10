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

// Preview/unlinked notes (created before a client match, or deliberately
// never matched) have no client row to pull a name from — fall back to
// the Doc title itself. Gemini doc titles sometimes carry a parenthetical
// qualifier (e.g. a company name) alongside the actual name, so prefer
// that when present; otherwise the cleaned title is the best guess.
function displayNameFromTitle(title: string): string {
  const cleaned = title.replace(/-\s*Notes by Gemini$/i, "").trim();
  const parenMatch = cleaned.match(/\(([^)]+)\)/);
  if (parenMatch?.[1]?.trim()) return parenMatch[1].trim();
  return cleaned || "there";
}

// Alternating tilt + card colour for a row of small cards (decisions),
// same "no two adjacent blocks match" rhythm as the rest of the brand.
const DECISION_CARDS = ["card-brutal-yellow tilt-l", "card-brutal-pink tilt-r"] as const;
const DETAIL_TABS = ["card-tab-pink", "card-tab-yellow", "card-tab-ink"] as const;

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

  const fallbackName = displayNameFromTitle(note.docTitle);
  const firstName = client?.firstName || client?.name || fallbackName;
  const displayName = client?.name || fallbackName;
  const shortVersion = note.recapSummary || note.summary;
  const hasDecisions = Boolean(note.decisions && note.decisions.length > 0);
  const hasDetails = Boolean(note.details && note.details.length > 0);

  return (
    <div className="min-h-screen bg-blush">
      {/* Hero */}
      <section className="px-8 pt-16 pb-8">
        <div className="max-w-5xl mx-auto w-full">
          <span className="eyebrow-pill mb-4">Call recap</span>
          <div className="hero-ink p-10 md:p-14 mt-4">
            <h1 className="font-heading font-[800] text-4xl md:text-5xl leading-[0.98] tracking-[-0.03em]">
              {firstName}, here&apos;s what <span className="text-[#F11787]">we covered</span>.
            </h1>
            <p className="text-cream/70 mt-4 max-w-lg">
              A record of the call — pull it up whenever you want to see where things landed.
            </p>
          </div>
          <div className="card-brutal-yellow relative z-10 -mt-6 mx-4 md:mx-8 p-6">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#0a0608]/60 mb-1">Prepared for</dt>
                <dd className="font-heading font-[800] text-sm">{displayName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#0a0608]/60 mb-1">Prepared by</dt>
                <dd className="font-heading font-[800] text-sm">Zoë Dew</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#0a0608]/60 mb-1">Call date</dt>
                <dd className="font-heading font-[800] text-sm">{formatDate(note.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-[#0a0608]/60 mb-1">Focus</dt>
                <dd className="font-heading font-[800] text-sm">{note.recapFocus || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Jump nav */}
      <nav className="px-8 pb-4">
        <div className="max-w-5xl mx-auto w-full flex flex-wrap gap-3">
          {shortVersion && (
            <a href="#short-version" className="pill-toggle px-4 py-1.5 text-xs font-heading font-[800]">
              Short version
            </a>
          )}
          {hasDecisions && (
            <a href="#decisions" className="pill-toggle px-4 py-1.5 text-xs font-heading font-[800]">
              Decisions
            </a>
          )}
          {hasDetails && (
            <a href="#covered" className="pill-toggle px-4 py-1.5 text-xs font-heading font-[800]">
              What we covered
            </a>
          )}
          {todos.length > 0 && (
            <a href="#next-steps" className="pill-toggle px-4 py-1.5 text-xs font-heading font-[800]">
              Next steps
            </a>
          )}
        </div>
      </nav>

      {shortVersion && (
        <section id="short-version" className="bg-cream px-8 py-16">
          <div className="max-w-5xl mx-auto w-full">
            <div className="card-brutal-blush tilt-l relative p-8">
              <span className="card-tab card-tab-pink">The short version</span>
              <p className="text-base leading-relaxed mt-2">{shortVersion}</p>
            </div>
          </div>
        </section>
      )}

      {hasDecisions && (
        <section id="decisions" className="px-8 py-16">
          <div className="max-w-5xl mx-auto w-full">
            <span className="eyebrow-pill mb-4">Decisions</span>
            <h2 className="font-heading font-[800] text-2xl md:text-3xl mt-3 mb-8">What got decided.</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {note.decisions!.map((decision, i) => (
                <div key={i} className={`${DECISION_CARDS[i % 2]} p-5 text-sm leading-relaxed`}>
                  {decision}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasDetails && (
        <section id="covered" className="bg-paper px-8 py-16">
          <div className="max-w-5xl mx-auto w-full">
            <span className="eyebrow-pill mb-4">What we covered</span>
            <h2 className="font-heading font-[800] text-2xl md:text-3xl mt-3 mb-10">
              Topic by topic.
            </h2>
            <div className="space-y-8">
              {note.details!.map((detail, i) => (
                <div key={i} className="flex gap-5">
                  <div className="step-badge step-badge-done">{i + 1}</div>
                  <div className={`card-brutal relative flex-1 p-6 ${i % 2 === 0 ? "tilt-r" : "tilt-l"}`}>
                    <span className={`card-tab ${DETAIL_TABS[i % 3]}`}>{detail.label}</span>
                    <p className="font-heading font-[800] text-lg mb-2 mt-2">{detail.title}</p>
                    <p className="text-sm leading-relaxed text-[#0a0608]/80">{detail.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {todos.length > 0 && (
        <section id="next-steps" className="px-8 py-16">
          <div className="max-w-5xl mx-auto w-full">
            <span className="eyebrow-pill mb-4">Next steps</span>
            <h2 className="font-heading font-[800] text-2xl md:text-3xl mt-3 mb-8">
              Your move.
            </h2>
            <RecapTodoList slug={slug} initialTodos={todos} />
          </div>
        </section>
      )}

      <section className="bg-cream px-8 py-16">
        <div className="max-w-5xl mx-auto w-full">
          <p className="font-heading font-[800] text-2xl">Zx</p>
        </div>
      </section>
    </div>
  );
}
