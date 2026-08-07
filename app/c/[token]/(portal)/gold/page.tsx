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
      <p className="text-sm tracking-wide uppercase text-[#F11787] font-heading font-[800] mb-10">
        GOLD Report
      </p>

      {groups.length === 0 && (
        <p className="text-sm text-[#0a0608]/60">
          No findings logged yet.
        </p>
      )}

      {groups.map((group, i) => (
        <section
          key={group.type}
          className={`mb-8 last:mb-0 p-6 ${i % 2 === 0 ? "card-brutal" : "card-brutal-blush"}`}
        >
          <h2 className="font-heading font-[800] text-2xl mb-4 tracking-[-0.03em]">
            {group.type}
          </h2>
          <ul>
            {group.findings.map((finding: Finding, j) => (
              <li
                key={finding.id}
                className={`py-6 flex justify-between gap-8 ${
                  j > 0 ? "border-t-2 border-[#0a0608]/15" : ""
                }`}
              >
                <div>
                  <p className="font-heading font-[800] text-lg mb-1">
                    {finding.title}
                  </p>
                  {finding.description && (
                    <p className="text-sm text-[#0a0608]/70 mb-3 max-w-md">
                      {finding.description}
                    </p>
                  )}
                  <p className="text-xs text-[#0a0608]/40 uppercase tracking-wide">
                    {[finding.source, formatDate(finding.dateFound)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading font-[800] text-xl">
                    {formatCurrency(finding.value)}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-[#0a0608]/50 mt-1">
                    {finding.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
