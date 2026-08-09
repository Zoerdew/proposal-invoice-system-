import { NextRequest, NextResponse } from "next/server";
import { LEAD_STAGE_OPTIONS, LeadStage, getLead, updateLead } from "@/lib/db/leads";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const lead = await getLead(id).catch(() => null);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
  if (!firstName && !lastName) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  await updateLead(id, {
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

  return NextResponse.json({ ok: true });
}
