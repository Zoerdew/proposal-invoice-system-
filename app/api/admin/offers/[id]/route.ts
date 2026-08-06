import { NextRequest, NextResponse } from "next/server";
import { LineItemKind } from "@/lib/db/shared";
import { getOffer, getOfferLineItems, updateOffer, replaceOfferLineItems } from "@/lib/db/offers";
import type { PaymentPlan } from "@/lib/paymentPlans";

interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const offer = await getOffer(id).catch(() => null);
  if (!offer) {
    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  }
  const lineItems = await getOfferLineItems(id);

  return NextResponse.json({
    contractTerms: offer.contractTerms,
    rows: lineItems.map((item) => ({
      description: item.description,
      kind: item.kind,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Offer name is required." }, { status: 400 });
  }
  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  const offer = await getOffer(id).catch(() => null);
  if (!offer) {
    return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  }

  await updateOffer(id, {
    name,
    tagline: body.tagline || null,
    description: body.description || null,
    contractTerms: body.contractTerms || null,
    paymentPlanOptions: Array.isArray(body.paymentPlans)
      ? (body.paymentPlans as PaymentPlan[])
      : undefined,
  });

  await replaceOfferLineItems(
    id,
    lineItems.filter((item) => item.description?.trim())
  );

  return NextResponse.json({ ok: true });
}
