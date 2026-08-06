import { NextRequest, NextResponse } from "next/server";
import {
  CheckinDay,
  RevenueDataSource,
  getClientByToken,
  updateClientOnboarding,
} from "@/lib/db/clients";

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
  const baselineMonthlyRevenue = Number(body?.baselineMonthlyRevenue);
  const annualTurnover = Number(body?.annualTurnover);
  const biggestChallengeRightNow = body?.biggestChallengeRightNow;
  const whatsGeneratingLeadsNow = body?.whatsGeneratingLeadsNow;
  const sixMonthRisk = body?.sixMonthRisk;
  const whyNow = body?.whyNow;
  const definitionOfSuccess = body?.definitionOfSuccess;
  const anythingElse = body?.anythingElse;

  if (
    !CHECKIN_DAYS.includes(bestDayForCheckin) ||
    !REVENUE_SOURCES.includes(whereRevenueDataLives) ||
    typeof programmeStartDate !== "string" ||
    !programmeStartDate.trim() ||
    !Number.isFinite(baselineMonthlyRevenue) ||
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
    (anythingElse !== undefined && typeof anythingElse !== "string")
  ) {
    return NextResponse.json({ error: "Invalid onboarding data" }, { status: 400 });
  }

  await updateClientOnboarding(client.id, {
    bestDayForCheckin,
    whereRevenueDataLives,
    programmeStartDate,
    baselineMonthlyRevenue,
    annualTurnover,
    biggestChallengeRightNow,
    whatsGeneratingLeadsNow,
    sixMonthRisk,
    whyNow,
    definitionOfSuccess: definitionOfSuccess?.trim() || undefined,
    anythingElse: anythingElse?.trim() || undefined,
  });

  return NextResponse.json({ ok: true });
}
