import { NextRequest, NextResponse } from "next/server";
import { LineItemKind } from "@/lib/db/shared";
import { createOffer, replaceOfferLineItems } from "@/lib/db/offers";
import type { PaymentPlan } from "@/lib/paymentPlans";

interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Offer name is required." }, { status: 400 });
  }
  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  const offer = await createOffer({
    name,
    tagline: body.tagline || null,
    description: body.description || null,
    contractTerms: body.contractTerms || null,
    paymentPlanOptions: Array.isArray(body.paymentPlans)
      ? (body.paymentPlans as PaymentPlan[])
      : undefined,
  });

  await replaceOfferLineItems(
    offer.id,
    lineItems.filter((item) => item.description?.trim())
  );

  return NextResponse.json({ id: offer.id });
}
