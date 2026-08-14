import { NextRequest, NextResponse } from "next/server";
import {
  CheckinDay,
  RevenueDataSource,
  getClientByToken,
  updateClientOnboarding,
} from "@/lib/db/clients";
import { replaceClientOffers, ClientOfferInput } from "@/lib/db/clientOffers";
import { replaceTimelineEvents, TimelineEventInput } from "@/lib/db/timelineEvents";

const CHECKIN_DAYS: CheckinDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
const REVENUE_SOURCES: RevenueDataSource[] = [
  "Stripe",
  "Other platform",
  "They'll send me reports",
];

function isValidOffers(value: unknown): value is ClientOfferInput[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.name === "string" &&
        item.name.trim() &&
        (item.price === undefined || typeof item.price === "number") &&
        (item.stillLive === undefined || typeof item.stillLive === "boolean") &&
        (item.deliveryHours === undefined || typeof item.deliveryHours === "number")
    )
  );
}

function isValidTimeline(value: unknown): value is TimelineEventInput[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.month === "string" &&
        item.month.trim() &&
        typeof item.whatHappened === "string" &&
        item.whatHappened.trim()
    )
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);

  const bestDayForCheckin = body?.bestDayForCheckin;
  const whereRevenueDataLives = body?.whereRevenueDataLives;
  const programmeStartDate = body?.programmeStartDate;
  const annualTurnover = Number(body?.annualTurnover);
  const biggestChallengeRightNow = body?.biggestChallengeRightNow;
  const whatsGeneratingLeadsNow = body?.whatsGeneratingLeadsNow;
  const sixMonthRisk = body?.sixMonthRisk;
  const whyNow = body?.whyNow;
  const definitionOfSuccess = body?.definitionOfSuccess;
  const anythingElse = body?.anythingElse;
  const postalAddress = body?.postalAddress;

  const paymentProcessors = body?.paymentProcessors;
  const emailPlatform = body?.emailPlatform;
  const subscriberCount = body?.subscriberCount;
  const whereEnquiriesLive = body?.whereEnquiriesLive;
  const analyticsAccess = body?.analyticsAccess;
  const offTheTable = body?.offTheTable;
  const whatTheyveTriedAndRuledOut = body?.whatTheyveTriedAndRuledOut;
  const ownTheory = body?.ownTheory;

  const offers = body?.offers ?? [];
  const timeline = body?.timeline ?? [];

  if (
    !CHECKIN_DAYS.includes(bestDayForCheckin) ||
    !REVENUE_SOURCES.includes(whereRevenueDataLives) ||
    typeof programmeStartDate !== "string" ||
    !programmeStartDate.trim() ||
    !Number.isFinite(annualTurnover) ||
    typeof biggestChallengeRightNow !== "string" ||
    !biggestChallengeRightNow.trim() ||
    typeof whatsGeneratingLeadsNow !== "string" ||
    !whatsGeneratingLeadsNow.trim() ||
    typeof sixMonthRisk !== "string" ||
    !sixMonthRisk.trim() ||
    typeof whyNow !== "string" ||
    !whyNow.trim() ||
    (definitionOfSuccess !== undefined && typeof definitionOfSuccess !== "string") ||
    (anythingElse !== undefined && typeof anythingElse !== "string") ||
    (postalAddress !== undefined && typeof postalAddress !== "string") ||
    (paymentProcessors !== undefined && typeof paymentProcessors !== "string") ||
    (emailPlatform !== undefined && typeof emailPlatform !== "string") ||
    (subscriberCount !== undefined && typeof subscriberCount !== "number") ||
    (whereEnquiriesLive !== undefined && typeof whereEnquiriesLive !== "string") ||
    (analyticsAccess !== undefined && typeof analyticsAccess !== "string") ||
    (offTheTable !== undefined && typeof offTheTable !== "string") ||
    (whatTheyveTriedAndRuledOut !== undefined && typeof whatTheyveTriedAndRuledOut !== "string") ||
    (ownTheory !== undefined && typeof ownTheory !== "string") ||
    !isValidOffers(offers) ||
    !isValidTimeline(timeline)
  ) {
    return NextResponse.json({ error: "Invalid onboarding data" }, { status: 400 });
  }

  await updateClientOnboarding(client.id, {
    bestDayForCheckin,
    whereRevenueDataLives,
    programmeStartDate,
    annualTurnover,
    biggestChallengeRightNow,
    whatsGeneratingLeadsNow,
    sixMonthRisk,
    whyNow,
    definitionOfSuccess: definitionOfSuccess?.trim() || undefined,
    anythingElse: anythingElse?.trim() || undefined,
    postalAddress: postalAddress?.trim() || undefined,
    paymentProcessors: paymentProcessors?.trim() || undefined,
    emailPlatform: emailPlatform?.trim() || undefined,
    subscriberCount: subscriberCount ?? undefined,
    whereEnquiriesLive: whereEnquiriesLive?.trim() || undefined,
    analyticsAccess: analyticsAccess?.trim() || undefined,
    offTheTable: offTheTable?.trim() || undefined,
    whatTheyveTriedAndRuledOut: whatTheyveTriedAndRuledOut?.trim() || undefined,
    ownTheory: ownTheory?.trim() || undefined,
  });

  await replaceClientOffers(client.id, offers);
  await replaceTimelineEvents(client.id, timeline);

  return NextResponse.json({ ok: true });
}
