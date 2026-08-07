import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import { getCheckinsByClientId } from "@/lib/db/checkIns";
import { getProofByClientId } from "@/lib/db/proof";
import { getDecisions } from "@/lib/db/decisions";
import RevenueTrendChart from "@/components/portal/RevenueTrendChart";
import ProofForm from "@/components/portal/ProofForm";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default async function EvidencePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const [checkins, proof, decisions] = await Promise.all([
    getCheckinsByClientId(client.id),
    getProofByClientId(client.id),
    getDecisions(client.id),
  ]);

  const chartData = checkins.map((c) => ({
    label: formatDate(c.weekDate),
    revenue: c.revenueThisWeek,
  }));

  const log = [...checkins].reverse();

  return (
    <div>
      <p className="text-sm tracking-wide uppercase text-[#F11787] font-heading font-[800] mb-10">
        Evidence Dashboard
      </p>

      <section className="card-brutal mb-10 p-8">
        <h2 className="font-heading font-[800] text-2xl mb-6 tracking-[-0.03em]">Revenue trend</h2>
        <RevenueTrendChart data={chartData} />
      </section>

      <section className="card-brutal-blush mb-10 p-8">
        <h2 className="font-heading font-[800] text-2xl mb-6 tracking-[-0.03em]">Weekly log</h2>
        {log.length === 0 && (
          <p className="text-sm text-[#0a0608]/50">No check-ins yet.</p>
        )}
        <ul>
          {log.map((c, i) => (
            <li
              key={c.id}
              className={`py-6 ${i > 0 ? "border-t-2 border-[#0a0608]/15" : ""}`}
            >
              <div className="flex justify-between items-baseline mb-2 gap-4">
                <p className="text-xs uppercase tracking-wide text-[#0a0608]/40">
                  {formatDate(c.weekDate)}
                  {c.feltLike && ` · Felt ${c.feltLike.toLowerCase()}`}
                </p>
                <p className="font-heading font-[800] text-sm shrink-0">
                  {formatCurrency(c.revenueThisWeek)}
                </p>
              </div>
              <p className="text-sm text-[#0a0608]/80">{c.qualitativeNotes}</p>
              {c.yourResponse && (
                <div className="mt-3 pl-4 border-l-[3px] border-[#F11787]">
                  <p className="text-xs uppercase tracking-wide text-[#0a0608]/40 mb-1">
                    Your response
                  </p>
                  <p className="text-sm text-[#0a0608]/70">{c.yourResponse}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card-brutal mb-10 p-8">
        <h2 className="font-heading font-[800] text-2xl mb-6 tracking-[-0.03em]">Decisions</h2>
        {decisions.length === 0 && (
          <p className="text-sm text-[#0a0608]/50">No decisions logged yet.</p>
        )}
        <ul>
          {decisions.map((d, i) => (
            <li
              key={d.id}
              className={`py-6 ${i > 0 ? "border-t-2 border-[#0a0608]/15" : ""}`}
            >
              <div className="flex justify-between items-baseline mb-2 gap-4">
                <p className="font-heading font-[800] text-sm">{d.decision}</p>
                {d.decidedAt && (
                  <p className="text-xs uppercase tracking-wide text-[#0a0608]/40 shrink-0">
                    {formatDate(d.decidedAt)}
                  </p>
                )}
              </div>
              {d.promptedByNumber && (
                <p className="text-xs uppercase tracking-wide text-[#0a0608]/40 mb-2">
                  Prompted by: {d.promptedByNumber}
                </p>
              )}
              {d.expected && (
                <p className="text-sm text-[#0a0608]/80 mb-1">
                  <span className="text-[#0a0608]/50">Expected: </span>
                  {d.expected}
                </p>
              )}
              {d.outcome && (
                <p className="text-sm text-[#0a0608]/80">
                  <span className="text-[#0a0608]/50">Outcome: </span>
                  {d.outcome}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card-brutal-blush p-8">
        <h2 className="font-heading font-[800] text-2xl mb-6 tracking-[-0.03em]">Proof</h2>
        {proof.length > 0 && (
          <ul className="mb-8">
            {proof.map((p, i) => (
              <li
                key={p.id}
                className={`py-6 ${i > 0 ? "border-t-2 border-[#0a0608]/15" : ""}`}
              >
                <p className="text-xs uppercase tracking-wide text-[#0a0608]/40 mb-2">
                  {[p.type, formatDate(p.dateAdded), p.source]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-sm text-[#0a0608]/80 mb-3">{p.text}</p>
                {p.screenshotUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.screenshotUrl}
                    alt="Proof screenshot"
                    className="max-w-xs rounded-[14px] border-2 border-[#0a0608]"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        <ProofForm token={token} />
      </section>
    </div>
  );
}
