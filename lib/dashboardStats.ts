import type { Lead } from "./db/leads";
import { LEAD_STAGE_OPTIONS, type LeadStage } from "./db/leadChoices";
import type { Proposal } from "./db/proposals";
import type { ProposalStatus } from "./db/shared";
import type { AdminClient } from "./db/clients";
import type { Product } from "./db/products";

const PROPOSAL_STATUS_ORDER: ProposalStatus[] = [
  "Draft",
  "Sent",
  "Viewed",
  "Signed",
  "Invoiced",
  "Paid",
];

const SENT_OR_LATER: ProposalStatus[] = ["Sent", "Viewed", "Signed", "Invoiced", "Paid"];
const SIGNED_OR_LATER: ProposalStatus[] = ["Signed", "Invoiced", "Paid"];
const OPEN_LEAD_STAGES: LeadStage[] = ["New", "In Progress", "Warm", "Hot"];

export interface LeadFunnel {
  byStage: { stage: LeadStage; count: number }[];
  closedWon: number;
  closedLost: number;
  closeRate: number | null;
}

export function computeLeadFunnel(leads: Lead[]): LeadFunnel {
  const byStage = LEAD_STAGE_OPTIONS.map((stage) => ({
    stage,
    count: leads.filter((l) => l.leadStage === stage).length,
  }));
  const closedWon = leads.filter((l) => l.leadStage === "Closed - Won").length;
  const closedLost = leads.filter((l) => l.leadStage === "Closed - Lost").length;
  const closedTotal = closedWon + closedLost;
  return {
    byStage,
    closedWon,
    closedLost,
    closeRate: closedTotal > 0 ? closedWon / closedTotal : null,
  };
}

export interface ProposalFunnel {
  byStatus: { status: ProposalStatus; count: number }[];
  sentCount: number;
  signedCount: number;
  closeRate: number | null; // signed-or-later as a share of sent-or-later
}

export function computeProposalFunnel(proposals: Proposal[]): ProposalFunnel {
  const byStatus = PROPOSAL_STATUS_ORDER.map((status) => ({
    status,
    count: proposals.filter((p) => p.status === status).length,
  }));
  const sentCount = proposals.filter((p) => SENT_OR_LATER.includes(p.status)).length;
  const signedCount = proposals.filter((p) => SIGNED_OR_LATER.includes(p.status)).length;
  return {
    byStatus,
    sentCount,
    signedCount,
    closeRate: sentCount > 0 ? signedCount / sentCount : null,
  };
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  byProduct: { productName: string; amount: number }[];
  total: number;
}

export interface RevenueOverTime {
  months: MonthlyRevenue[];
  excludedCount: number; // clients with no start date and/or no package price
}

// Uses each client's own package price against when their proposal was
// signed — not their programme start date (a scheduling detail, not a
// sales one) and not proposal/invoice totals, which would mean pulling
// every proposal's line items just to build a chart. Signed date also
// lines up with the Closed - Won lead automation, which fires off the
// same signing event.
export function computeRevenueByMonth(
  clients: AdminClient[],
  products: Product[],
  proposals: Proposal[]
): RevenueOverTime {
  const productNameById = new Map(products.map((p) => [p.id, p.name]));
  const dateSignedByProposalId = new Map(proposals.map((p) => [p.id, p.dateSigned]));

  const billable = clients.flatMap((c) => {
    const dateSigned = c.proposalId ? dateSignedByProposalId.get(c.proposalId) : null;
    if (!dateSigned || c.packagePrice == null) return [];
    return [{ ...c, dateSigned, packagePrice: c.packagePrice }];
  });

  const byMonth = new Map<string, Map<string, number>>();
  for (const client of billable) {
    const month = client.dateSigned.slice(0, 7);
    const productName = productNameById.get(client.productId ?? "") ?? "Unknown product";
    const monthMap = byMonth.get(month) ?? new Map<string, number>();
    monthMap.set(productName, (monthMap.get(productName) ?? 0) + client.packagePrice);
    byMonth.set(month, monthMap);
  }

  const months = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, productMap]) => {
      const byProduct = Array.from(productMap.entries()).map(([productName, amount]) => ({
        productName,
        amount,
      }));
      return {
        month,
        byProduct,
        total: byProduct.reduce((sum, p) => sum + p.amount, 0),
      };
    });

  return { months, excludedCount: clients.length - billable.length };
}

export interface LeadSourceStat {
  source: string;
  count: number;
  closedWon: number;
  closeRate: number | null;
  valueWon: number;
}

export function computeLeadSourcePerformance(leads: Lead[]): LeadSourceStat[] {
  const bySource = new Map<string, Lead[]>();
  for (const lead of leads) {
    const source = lead.source.trim() || "Unknown";
    bySource.set(source, [...(bySource.get(source) ?? []), lead]);
  }

  return Array.from(bySource.entries())
    .map(([source, sourceLeads]) => {
      const won = sourceLeads.filter((l) => l.leadStage === "Closed - Won");
      const closedTotal = sourceLeads.filter(
        (l) => l.leadStage === "Closed - Won" || l.leadStage === "Closed - Lost"
      ).length;
      return {
        source,
        count: sourceLeads.length,
        closedWon: won.length,
        closeRate: closedTotal > 0 ? won.length / closedTotal : null,
        valueWon: won.reduce((sum, l) => sum + (l.leadValue ?? 0), 0),
      };
    })
    .sort((a, b) => b.count - a.count);
}

export interface PipelineSnapshot {
  openLeads: { stage: LeadStage; count: number }[];
  openLeadsTotal: number;
  awaitingSignature: { count: number; oldestDaysAgo: number | null };
  awaitingPayment: { count: number; totalValue: number };
}

export function computePipelineSnapshot(
  leads: Lead[],
  proposals: Proposal[],
  invoicedProposalTotals: Map<string, number>,
  now: Date
): PipelineSnapshot {
  const openLeads = OPEN_LEAD_STAGES.map((stage) => ({
    stage,
    count: leads.filter((l) => l.leadStage === stage).length,
  }));

  const awaiting = proposals.filter((p) => p.status === "Sent" || p.status === "Viewed");
  const daysAgo = awaiting
    .map((p) => p.dateSent)
    .filter((d): d is string => Boolean(d))
    .map((d) => Math.floor((now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)));

  const invoiced = proposals.filter((p) => p.status === "Invoiced");
  const awaitingPaymentTotal = invoiced.reduce(
    (sum, p) => sum + (invoicedProposalTotals.get(p.id) ?? 0),
    0
  );

  return {
    openLeads,
    openLeadsTotal: openLeads.reduce((sum, s) => sum + s.count, 0),
    awaitingSignature: {
      count: awaiting.length,
      oldestDaysAgo: daysAgo.length > 0 ? Math.max(...daysAgo) : null,
    },
    awaitingPayment: {
      count: invoiced.length,
      totalValue: awaitingPaymentTotal,
    },
  };
}
