import { NextRequest, NextResponse } from "next/server";
import { updateClientAdmin } from "@/lib/db/clients";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const client = await updateClientAdmin(id, {
    name: body.name,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    businessName: body.businessName,
    status: body.status,
    startDate: body.startDate,
    endDate: body.endDate,
    packagePrice: body.packagePrice,
    paymentPlan: body.paymentPlan,
    commercialObjectives: body.commercialObjectives,
    notes: body.notes,
    targetFigure: body.targetFigure,
    baselineMonthlyRevenue: body.baselineMonthlyRevenue,
    baselineRepeatBuyerPct: body.baselineRepeatBuyerPct,
    annualTurnover: body.annualTurnover,
    baselineDate: body.baselineDate,
    productId: body.productId,
  });

  return NextResponse.json({ ok: true, id: client.id });
}
