import { NextRequest, NextResponse } from "next/server";
import { LEAD_STAGE_OPTIONS, LeadStage, createLead, listLeads } from "@/lib/db/leads";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");
  const productId = searchParams.get("product");

  const leads = await listLeads({
    stage: (LEAD_STAGE_OPTIONS as readonly string[]).includes(stage ?? "")
      ? (stage as LeadStage)
      : undefined,
    productId: productId || undefined,
  });

  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";

  if (!firstName && !lastName) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const lead = await createLead({
    firstName: firstName || null,
    lastName: lastName || null,
    email: body?.email || null,
    phone: body?.phone || null,
    source: body?.source || null,
    productId: body?.productId || null,
    leadStage: (LEAD_STAGE_OPTIONS as readonly string[]).includes(body?.leadStage)
      ? (body.leadStage as LeadStage)
      : undefined,
    leadValue: body?.leadValue != null ? Number(body.leadValue) : null,
    conversionProbability:
      body?.conversionProbability != null ? Number(body.conversionProbability) : null,
    notes: body?.notes || null,
    firstContactDate: body?.firstContactDate || null,
    closeDate: body?.closeDate || null,
    daysUntilNextContact:
      body?.daysUntilNextContact != null ? Number(body.daysUntilNextContact) : null,
    applicationId: body?.applicationId || null,
  });

  return NextResponse.json({ id: lead.id }, { status: 201 });
}
