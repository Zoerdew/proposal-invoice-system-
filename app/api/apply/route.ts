import { NextRequest, NextResponse } from "next/server";
import {
  ANNUAL_TURNOVER_OPTIONS,
  BUDGET_FIT_OPTIONS,
  DATA_HISTORY_OPTIONS,
  DATA_STATE_OPTIONS,
  REPEAT_BUSINESS_OPTIONS,
  START_TIMING_OPTIONS,
  TOOLS_USED_OPTIONS,
  WHAT_THEYRE_AFTER_OPTIONS,
  createApplication,
} from "@/lib/db/applications";
import { sendSlackAlert } from "@/lib/slack";

function optionalChoice<T extends string>(value: unknown, options: readonly T[]): T | undefined {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const applicantName = typeof body?.applicantName === "string" ? body.applicantName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!applicantName || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const toolsUsed = Array.isArray(body?.toolsUsed)
    ? body.toolsUsed.filter((t: unknown) => typeof t === "string" && (TOOLS_USED_OPTIONS as readonly string[]).includes(t))
    : [];

  const application = await createApplication({
    applicantName,
    email,
    businessName: body?.businessName || undefined,
    website: body?.website || undefined,
    whatBusinessDoes: body?.whatBusinessDoes || undefined,
    timeInBusiness: body?.timeInBusiness || undefined,
    annualTurnover: optionalChoice(body?.annualTurnover, ANNUAL_TURNOVER_OPTIONS),
    mainOffersPricing: body?.mainOffersPricing || undefined,
    topRevenueOffer: body?.topRevenueOffer || undefined,
    repeatBusiness: optionalChoice(body?.repeatBusiness, REPEAT_BUSINESS_OPTIONS),
    toolsUsed,
    dataHistory: optionalChoice(body?.dataHistory, DATA_HISTORY_OPTIONS),
    dataState: optionalChoice(body?.dataState, DATA_STATE_OPTIONS),
    whatTheyveTried: body?.whatTheyveTried || undefined,
    biggestOpportunity: body?.biggestOpportunity || undefined,
    slowWeekBehaviour: body?.slowWeekBehaviour || undefined,
    whyNow: body?.whyNow || undefined,
    whatTheyreAfter: optionalChoice(body?.whatTheyreAfter, WHAT_THEYRE_AFTER_OPTIONS),
    opennessToEvidence: body?.opennessToEvidence || undefined,
    startTiming: optionalChoice(body?.startTiming, START_TIMING_OPTIONS),
    budgetFit: optionalChoice(body?.budgetFit, BUDGET_FIT_OPTIONS),
    anythingElse: body?.anythingElse || undefined,
  });

  await sendSlackAlert(
    `📝 New application — *${applicantName}*${application.businessName ? ` (${application.businessName})` : ""}, ${email}. Review in admin: /admin/applications/${application.id}`
  );

  return NextResponse.json({ id: application.id }, { status: 201 });
}
