import { listLeads } from "@/lib/db/leads";
import { listProposals } from "@/lib/db/proposals";
import { listClientsAdmin } from "@/lib/db/clients";
import { listProducts } from "@/lib/db/products";
import { getLineItemsForProposal, getIncludedLineItems, computeTotal } from "@/lib/db/lineItems";
import {
  computeLeadFunnel,
  computeProposalFunnel,
  computeRevenueByMonth,
  computeLeadSourcePerformance,
  computePipelineSnapshot,
} from "@/lib/dashboardStats";

export const dynamic = "force-dynamic";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number | null): string {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function Bar({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 ? Math.max((count / max) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="font-heading font-[800]">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-[#0a0608]/10">
        <div className="h-2 rounded-full bg-[#F11787]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="admin-card p-6">
      <p className="admin-label mb-2">{label}</p>
      <p className="font-heading font-[800] text-2xl">{value}</p>
      {sub && <p className="mt-1 text-sm text-[#0a0608]/50">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [leads, proposals, clients, products] = await Promise.all([
    listLeads(),
    listProposals(),
    listClientsAdmin(),
    listProducts(),
  ]);

  const invoicedProposals = proposals.filter((p) => p.status === "Invoiced");
  const invoicedTotalsEntries = await Promise.all(
    invoicedProposals.map(async (p) => {
      const items = await getLineItemsForProposal(p.id);
      return [p.id, computeTotal(getIncludedLineItems(items))] as const;
    })
  );
  const invoicedTotals = new Map(invoicedTotalsEntries);

  const leadFunnel = computeLeadFunnel(leads);
  const proposalFunnel = computeProposalFunnel(proposals);
  const revenue = computeRevenueByMonth(clients, products);
  const sourcePerformance = computeLeadSourcePerformance(leads);
  const pipeline = computePipelineSnapshot(leads, proposals, invoicedTotals, new Date());

  const leadStageMax = Math.max(1, ...leadFunnel.byStage.map((s) => s.count));
  const proposalStatusMax = Math.max(1, ...proposalFunnel.byStatus.map((s) => s.count));
  const revenueMax = Math.max(1, ...revenue.months.map((m) => m.total));

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">Dashboard</h1>

      <section className="mb-10 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open leads"
          value={String(pipeline.openLeadsTotal)}
          sub={pipeline.openLeads.map((s) => `${s.stage}: ${s.count}`).join(" · ")}
        />
        <StatCard
          label="Awaiting signature"
          value={String(pipeline.awaitingSignature.count)}
          sub={
            pipeline.awaitingSignature.oldestDaysAgo != null
              ? `Oldest sent ${pipeline.awaitingSignature.oldestDaysAgo} days ago`
              : undefined
          }
        />
        <StatCard
          label="Invoiced, awaiting payment"
          value={formatCurrency(pipeline.awaitingPayment.totalValue)}
          sub={`${pipeline.awaitingPayment.count} invoice${pipeline.awaitingPayment.count === 1 ? "" : "s"}`}
        />
      </section>

      <section className="mb-10 grid gap-6 sm:grid-cols-2">
        <div className="admin-card p-6">
          <h2 className="mb-1 font-heading font-[800] text-lg">Lead funnel</h2>
          <p className="mb-4 text-sm text-[#0a0608]/50">
            {leadFunnel.closeRate != null
              ? `${formatPercent(leadFunnel.closeRate)} of closed leads won (${leadFunnel.closedWon} won, ${leadFunnel.closedLost} lost)`
              : "No closed leads yet."}
          </p>
          {leadFunnel.byStage.map((s) => (
            <Bar key={s.stage} label={s.stage} count={s.count} max={leadStageMax} />
          ))}
        </div>

        <div className="admin-card p-6">
          <h2 className="mb-1 font-heading font-[800] text-lg">Proposal funnel</h2>
          <p className="mb-4 text-sm text-[#0a0608]/50">
            {proposalFunnel.sentCount > 0
              ? `${formatPercent(proposalFunnel.closeRate)} of sent proposals signed (${proposalFunnel.signedCount} of ${proposalFunnel.sentCount})`
              : "No proposals sent yet."}
          </p>
          {proposalFunnel.byStatus.map((s) => (
            <Bar key={s.status} label={s.status} count={s.count} max={proposalStatusMax} />
          ))}
        </div>
      </section>

      <section className="mb-10 admin-card p-6">
        <h2 className="mb-1 font-heading font-[800] text-lg">Revenue by month</h2>
        <p className="mb-4 text-sm text-[#0a0608]/50">
          By client package price against their start date, not invoiced or collected amounts.
          {revenue.excludedCount > 0 &&
            ` ${revenue.excludedCount} client${revenue.excludedCount === 1 ? "" : "s"} excluded — missing a start date or package price.`}
        </p>
        {revenue.months.length === 0 ? (
          <p className="text-sm text-[#0a0608]/50">No billable clients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0a0608]/15 text-left">
                  <th className="py-2 pr-4 font-heading font-[800]">Month</th>
                  <th className="py-2 pr-4 font-heading font-[800]">By product</th>
                  <th className="py-2 pr-4 font-heading font-[800] text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {revenue.months.map((m) => (
                  <tr key={m.month} className="border-b border-[#0a0608]/5">
                    <td className="py-2 pr-4">{formatMonth(m.month)}</td>
                    <td className="py-2 pr-4 text-[#0a0608]/70">
                      {m.byProduct.map((p) => `${p.productName}: ${formatCurrency(p.amount)}`).join(" · ")}
                    </td>
                    <td className="py-2 pr-4 text-right font-heading font-[800]">
                      {formatCurrency(m.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 pr-4" colSpan={2}>
                    Total
                  </td>
                  <td className="pt-3 pr-4 text-right font-heading font-[800]">
                    {formatCurrency(revenue.months.reduce((sum, m) => sum + m.total, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {revenueMax > 0 && (
          <div className="mt-4">
            {revenue.months.map((m) => (
              <Bar key={m.month} label={formatMonth(m.month)} count={m.total} max={revenueMax} />
            ))}
          </div>
        )}
      </section>

      <section className="admin-card p-6">
        <h2 className="mb-1 font-heading font-[800] text-lg">Lead source performance</h2>
        <p className="mb-4 text-sm text-[#0a0608]/50">
          Close rate is share of closed leads (won or lost) that were won — open leads aren&apos;t
          counted either way yet.
        </p>
        {sourcePerformance.length === 0 ? (
          <p className="text-sm text-[#0a0608]/50">No leads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0a0608]/15 text-left">
                  <th className="py-2 pr-4 font-heading font-[800]">Source</th>
                  <th className="py-2 pr-4 font-heading font-[800] text-right">Leads</th>
                  <th className="py-2 pr-4 font-heading font-[800] text-right">Closed-won</th>
                  <th className="py-2 pr-4 font-heading font-[800] text-right">Close rate</th>
                  <th className="py-2 pr-4 font-heading font-[800] text-right">Value won</th>
                </tr>
              </thead>
              <tbody>
                {sourcePerformance.map((s) => (
                  <tr key={s.source} className="border-b border-[#0a0608]/5">
                    <td className="py-2 pr-4">{s.source}</td>
                    <td className="py-2 pr-4 text-right">{s.count}</td>
                    <td className="py-2 pr-4 text-right">{s.closedWon}</td>
                    <td className="py-2 pr-4 text-right">{formatPercent(s.closeRate)}</td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(s.valueWon)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
