import { getClientAdmin, getOnboardingByClientId } from "./db/clients";
import { getTimelineEvents } from "./db/timelineEvents";
import { getClientOffers } from "./db/clientOffers";
import { getFindingsByClientId } from "./db/findings";
import { getDataSources } from "./db/dataSources";
import { getDecisions } from "./db/decisions";
import { getMetrics, getMetricReadings } from "./db/metrics";
import { listMeetingNotesForClient } from "./db/meetingNotes";
import { listProducts } from "./db/products";

function formatCurrency(n: number | null): string | null {
  if (n == null) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  return new Date(Number(year), Number(m) - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function line(label: string, value: string | number | null | undefined): string | null {
  if (value == null || value === "") return null;
  return `${label}: ${value}`;
}

// Several date columns come back as full ISO timestamps even though only
// the date is ever meaningful here — trims to YYYY-MM-DD for a plain-text
// export a human is going to read.
function dateOnly(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null;
}

function section(title: string, lines: string[], emptyText = "None recorded."): string {
  return `${title}\n${"=".repeat(title.length)}\n${lines.length > 0 ? lines.join("\n") : emptyText}`;
}

// Everything Zoë has on a client, as one plain-text block — for pasting
// into a doc, email, or an AI tool, not for machine parsing. Skips
// meeting notes' rawContent (Gemini transcript dumps can be huge) in
// favour of the summary/decisions Phase 12 already extracted from them.
export async function getClientExportText(clientId: string): Promise<string> {
  const [client, onboarding, timeline, offers, findings, dataSources, decisions, metrics, meetingNotes, products] =
    await Promise.all([
      getClientAdmin(clientId),
      getOnboardingByClientId(clientId),
      getTimelineEvents(clientId),
      getClientOffers(clientId),
      getFindingsByClientId(clientId),
      getDataSources(clientId),
      getDecisions(clientId),
      getMetrics(clientId),
      listMeetingNotesForClient(clientId),
      listProducts(),
    ]);

  const metricsWithReadings = await Promise.all(
    metrics.map(async (m) => ({ metric: m, readings: await getMetricReadings(m.id) }))
  );

  const product = products.find((p) => p.id === client.productId);

  const header = [
    `${client.name}${client.businessName ? ` — ${client.businessName}` : ""}`,
    ...[
      line("Email", client.email),
      line("Status", client.status),
      line("Product", product?.name),
      line(
        "Package price",
        formatCurrency(client.packagePrice) &&
          `${formatCurrency(client.packagePrice)}${client.paymentPlan ? ` (${client.paymentPlan})` : ""}`
      ),
      line("Start date", dateOnly(client.startDate)),
      line("End date", dateOnly(client.endDate)),
      line("Target figure", formatCurrency(client.targetFigure)),
      line("Baseline monthly revenue", formatCurrency(client.baselineMonthlyRevenue)),
      line(
        "Baseline repeat buyer %",
        client.baselineRepeatBuyerPct != null ? `${client.baselineRepeatBuyerPct}%` : null
      ),
      line("Baseline date", dateOnly(client.baselineDate)),
      line("Annual turnover", formatCurrency(client.annualTurnover)),
      line("Commercial objectives", client.commercialObjectives),
      line("Notes", client.notes),
      line("Portal", `/c/${client.portalToken}`),
    ].filter((l): l is string => l != null),
  ].join("\n");

  const onboardingLines = onboarding
    ? [
        line("Best day for check-in", onboarding.bestDayForCheckin),
        line("Where revenue data lives", onboarding.whereRevenueDataLives),
        line("Biggest challenge right now", onboarding.biggestChallengeRightNow),
        line("What's generating leads now", onboarding.whatsGeneratingLeadsNow),
        line("Six month risk", onboarding.sixMonthRisk),
        line("Why now", onboarding.whyNow),
        line("Definition of success", onboarding.definitionOfSuccess),
        line("Payment processors", onboarding.paymentProcessors),
        line("Email platform", onboarding.emailPlatform),
        line("Subscriber count", onboarding.subscriberCount),
        line("Where enquiries live", onboarding.whereEnquiriesLive),
        line("Analytics access", onboarding.analyticsAccess),
        line("What's off the table", onboarding.offTheTable),
        line("What they've tried and ruled out", onboarding.whatTheyveTriedAndRuledOut),
        line("Own theory", onboarding.ownTheory),
        line("Postal address", onboarding.postalAddress),
        line("Anything else", onboarding.anythingElse),
      ].filter((l): l is string => l != null)
    : [];

  const timelineLines = timeline.map(
    (t) => `${t.month ? formatMonth(t.month) : "—"}: ${t.whatHappened}`
  );

  const offerLines = offers.map(
    (o, i) =>
      `${i + 1}. ${o.name}${formatCurrency(o.price) ? ` — ${formatCurrency(o.price)}` : ""} — ${
        o.stillLive ? "Still live" : "No longer offered"
      }${o.deliveryHours != null ? ` — ~${o.deliveryHours}h delivery` : ""}`
  );

  const findingLines = findings.map((f) => {
    const head = [
      `[${f.type}] ${f.title}`,
      formatCurrency(f.value),
      f.status,
      dateOnly(f.dateFound),
      f.source && `via ${f.source}`,
    ]
      .filter(Boolean)
      .join(" — ");
    return f.description ? `${head}\n  ${f.description}` : head;
  });

  const dataSourceLines = dataSources.map((d) =>
    [d.kind, d.periodCovered, d.receivedAt && `received ${d.receivedAt}`, d.fileUrl].filter(Boolean).join(" — ")
  );

  const decisionLines = decisions.map((d) => {
    const head = [dateOnly(d.decidedAt), d.decision].filter(Boolean).join(" — ");
    const detail = [
      d.promptedByNumber && `Prompted by: ${d.promptedByNumber}`,
      d.expected && `Expected: ${d.expected}`,
      d.outcome && `Outcome: ${d.outcome}`,
    ].filter(Boolean);
    return detail.length > 0 ? `${head}\n  ${detail.join(" | ")}` : head;
  });

  const metricLines = metricsWithReadings.map(({ metric, readings }) => {
    const baselineTarget =
      metric.baseline != null || metric.target != null
        ? ` (baseline ${metric.baseline ?? "—"}, target ${metric.target ?? "—"})`
        : "";
    const head = `${metric.name}${metric.definition ? ` — ${metric.definition}` : ""}${baselineTarget}`;
    const readingLines = readings.map((r) => `  ${r.readAt}: ${r.value ?? "—"}`);
    return [head, ...readingLines].join("\n");
  });

  const meetingNoteLines = meetingNotes.map((n) => {
    const parts = [`${n.docTitle} (${n.createdAt.slice(0, 10)})`];
    if (n.summary) parts.push(n.summary);
    if (n.decisions && n.decisions.length > 0) parts.push(`Decisions: ${n.decisions.join("; ")}`);
    return parts.join("\n  ");
  });

  return [
    header,
    section("ONBOARDING", onboardingLines, "Not submitted yet."),
    section("TIMELINE", timelineLines),
    section("OFFERS", offerLines),
    section("FINDINGS", findingLines),
    section("DATA SOURCES", dataSourceLines),
    section("DECISIONS", decisionLines),
    section("METRICS", metricLines),
    section("MEETING NOTES", meetingNoteLines),
  ].join("\n\n");
}
