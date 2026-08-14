import { NextRequest, NextResponse } from "next/server";
import { LEAD_STAGE_OPTIONS, LeadStage, deleteLead, getLead, updateLead } from "@/lib/db/leads";

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const lead = await getLead(id).catch(() => null);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  try {
    await deleteLead(id);
  } catch (err) {
    // Postgres 23503: foreign_key_violation — a proposal still points at
    // this lead (proposals.lead_id has no ON DELETE clause), so it can't
    // be removed without leaving that proposal dangling.
    const code = (err as { code?: string })?.code;
    if (code === "23503") {
      return NextResponse.json(
        { error: "This lead has a linked proposal and can't be deleted." },
        { status: 409 }
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
