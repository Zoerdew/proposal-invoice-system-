import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import { getFindingsByClientId, Finding } from "@/lib/db/findings";
import type { FindingType } from "@/lib/db/shared";

const GROUP_ORDER: FindingType[] = ["Gain", "Opportunity", "Leak", "Driver"];

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
    year: "numeric",
  });
}

function statusBadgeClass(status: string): string {
  if (status === "Banked") return "badge badge-strong";
  if (status === "Fixed") return "badge badge-pos";
  return "badge badge-neutral";
}

export default async function GoldPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const findings = await getFindingsByClientId(client.id);

  const groups = GROUP_ORDER.map((type) => ({
    type,
    findings: findings.filter((f) => f.type === type),
  })).filter((group) => group.findings.length > 0);

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-10">
        <span className="eyebrow-pill">In Control</span>
        <h1 className="font-heading font-[800] text-4xl md:text-5xl leading-[0.98] tracking-[-0.03em]">
          <span className="text-accent">GOLD</span> Report
        </h1>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-[#0a0608]/60">
          No findings logged yet.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {groups.map((group, i) => (
          <section
            key={group.type}
            className={`relative p-6 ${i % 2 === 0 ? "card-brutal" : "card-brutal-blush"}`}
          >
            <span className="card-tab card-tab-pink">
              {group.findings.length} {group.findings.length === 1 ? "finding" : "findings"}
            </span>
            <h2 className="font-heading font-[800] text-2xl mb-4 mt-2 tracking-[-0.03em]">
              {group.type}
            </h2>
            <ul>
              {group.findings.map((finding: Finding, j) => (
                <li
                  key={finding.id}
                  className={`py-6 flex flex-wrap justify-between gap-4 ${
                    j > 0 ? "border-t-2 border-[#0a0608]/15" : ""
                  }`}
                >
                  <div>
                    <p className="font-heading font-[800] text-lg mb-1">
                      {finding.title}
                    </p>
                    {finding.description && (
                      <p className="text-sm text-[#0a0608]/70 mb-3 max-w-xs">
                        {finding.description}
                      </p>
                    )}
                    <p className="text-xs text-[#0a0608]/40 uppercase tracking-wide">
                      {[finding.source, formatDate(finding.dateFound)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="font-heading font-[800] text-xl">
                      {formatCurrency(finding.value)}
                    </p>
                    <span className={statusBadgeClass(finding.status)}>{finding.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
