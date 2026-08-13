import { notFound } from "next/navigation";
import { getMeetingNoteByRecapSlug } from "@/lib/db/meetingNotes";
import { listTodosForMeetingNote } from "@/lib/db/todos";
import { getClientAdmin } from "@/lib/db/clients";
import RecapTodoList from "@/components/recap/RecapTodoList";
import RecapConfirmCta from "@/components/recap/RecapConfirmCta";

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

// A calmer, editorial register than the rest of the app's chunky/tilted
// brand default — this page is read 1:1 by a client after a paid call,
// so it leans on the same ink/pink/yellow/cream/paper tokens and type but
// drops rotation, hard offset shadows and sticker tabs in favour of thin
// borders and flat cards. Scoped to this page only, not the shared
// card-brutal/tilt/card-tab primitives used elsewhere.
const TOPIC_TAGS = [
  "bg-yellow text-[#0a0608]",
  "bg-[#F11787] text-cream",
  "bg-[#0a0608] text-cream",
] as const;

const SECTION_PILL =
  "inline-flex border-2 border-[#0a0608] rounded-full px-4 py-1.5 text-xs uppercase tracking-wide font-heading font-[800]";

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

  const sections = [
    shortVersion && { id: "short-version", label: "The short version" },
    hasDetails && { id: "covered", label: "What we covered" },
    hasDecisions && { id: "decisions", label: "Decisions" },
    todos.length > 0 && { id: "next-steps", label: "Next steps" },
    { id: "confirm", label: "Go ahead" },
  ].filter((s): s is { id: string; label: string } => Boolean(s));

  return (
    <div className="min-h-screen bg-blush">
      {/* Hero */}
      <section className="px-8 pt-16 pb-10">
        <div className="max-w-5xl mx-auto w-full grid lg:grid-cols-[260px_1fr] gap-5">
          <div className="lg:row-span-2 bg-[#0a0608] text-cream rounded-[20px] p-8 flex flex-col justify-center">
            <p className="italic text-cream/50 text-lg leading-none mb-1">your</p>
            <p className="font-heading font-[800] text-3xl uppercase tracking-[-0.03em] mb-6">Recap</p>
            <p className="text-xs uppercase tracking-[0.15em] text-cream/40">Call recap</p>
          </div>

          <div className="bg-cream rounded-[20px] border-2 border-[#0a0608] p-8 md:p-10">
            <span className={`${SECTION_PILL} mb-6`}>Call recap</span>
            <h1 className="font-heading font-[800] text-3xl md:text-4xl leading-tight tracking-[-0.03em] mb-4">
              {firstName}, here&apos;s what <span className="text-[#F11787]">we covered</span>.
            </h1>
            <p className="text-[#0a0608]/60 max-w-md">
              A record of the call — pull it up whenever you want to see where things landed.
            </p>
          </div>

          <div className="bg-[#0a0608] text-cream rounded-[20px] p-6 md:p-8">
            <dl className="space-y-3">
              {[
                ["Prepared for", displayName],
                ["Prepared by", "Zoë Dew"],
                ["Call date", formatDate(note.createdAt)],
                ["Focus", note.recapFocus || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-xs uppercase tracking-wide text-cream/40 shrink-0">{label}</dt>
                  <dd className="font-heading font-[800] text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Jump nav */}
      {sections.length > 0 && (
        <nav className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-y-2 border-[#0a0608] px-8 py-3">
          <div className="max-w-5xl mx-auto w-full flex items-center gap-6 overflow-x-auto">
            <span className="text-xs uppercase tracking-wide text-[#0a0608]/40 font-heading font-[800] shrink-0">
              Jump to
            </span>
            {sections.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 shrink-0 text-xs uppercase tracking-wide font-heading font-[800]"
              >
                <span className="w-5 h-5 rounded-full bg-yellow text-[#0a0608] flex items-center justify-center text-[10px] shrink-0">
                  {i + 1}
                </span>
                {s.label}
              </a>
            ))}
          </div>
        </nav>
      )}

      {shortVersion && (
        <section id="short-version" className="px-8 py-16">
          <div className="max-w-3xl mx-auto w-full text-center mb-8">
            <span className={`${SECTION_PILL} mb-4`}>The short version</span>
            <h2 className="font-heading font-[800] text-3xl md:text-4xl tracking-[-0.03em]">
              What we <span className="text-[#F11787]">landed on</span>.
            </h2>
          </div>
          <div className="max-w-3xl mx-auto bg-cream rounded-[20px] border-2 border-[#0a0608] p-8">
            <p className="text-base leading-relaxed">{shortVersion}</p>
          </div>
        </section>
      )}

      {hasDetails && (
        <section id="covered" className="px-8 py-16">
          <div className="max-w-3xl mx-auto w-full text-center mb-10">
            <span className={`${SECTION_PILL} mb-4`}>What we covered</span>
            <h2 className="font-heading font-[800] text-3xl md:text-4xl tracking-[-0.03em]">Topic by topic.</h2>
          </div>
          <div className="max-w-5xl mx-auto w-full grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {note.details!.map((detail, i) => (
              <div key={i} className="bg-cream rounded-[20px] border-2 border-[#0a0608] p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#0a0608]/15">
                  <span className="text-xs uppercase tracking-wide text-[#0a0608]/40 font-heading font-[800]">
                    Topic {i + 1}
                  </span>
                  <span
                    className={`ml-auto inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-wide font-heading font-[800] ${TOPIC_TAGS[i % TOPIC_TAGS.length]}`}
                  >
                    {detail.label}
                  </span>
                </div>
                <p className="font-heading font-[800] text-lg mb-2">{detail.title}</p>
                <p className="text-sm leading-relaxed text-[#0a0608]/70">{detail.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasDecisions && (
        <section id="decisions" className="px-8 py-16">
          <div className="max-w-3xl mx-auto w-full text-center mb-10">
            <span className={`${SECTION_PILL} mb-4`}>Decisions</span>
            <h2 className="font-heading font-[800] text-3xl md:text-4xl tracking-[-0.03em]">What got decided.</h2>
          </div>
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {note.decisions!.map((decision, i) => (
              <div key={i} className="flex items-start gap-4 bg-cream rounded-2xl border-2 border-[#0a0608] p-5">
                <span className="w-6 h-6 rounded-full bg-yellow text-[#0a0608] flex items-center justify-center text-xs font-heading font-[800] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed">{decision}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {todos.length > 0 && (
        <section id="next-steps" className="px-8 py-16">
          <div className="max-w-3xl mx-auto w-full text-center mb-10">
            <span className={`${SECTION_PILL} mb-4`}>Next steps</span>
            <h2 className="font-heading font-[800] text-3xl md:text-4xl tracking-[-0.03em]">Your move.</h2>
          </div>
          <div className="max-w-3xl mx-auto w-full">
            <RecapTodoList slug={slug} initialTodos={todos} />
          </div>
        </section>
      )}

      <section id="confirm" className="px-8 py-16">
        <div className="max-w-3xl mx-auto w-full">
          <RecapConfirmCta clientName={displayName} />
        </div>
      </section>

      <section className="px-8 py-16">
        <div className="max-w-5xl mx-auto w-full">
          <p className="font-heading font-[800] text-2xl">Zx</p>
        </div>
      </section>
    </div>
  );
}
