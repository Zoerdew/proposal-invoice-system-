import { NextRequest, NextResponse } from "next/server";
import { LineItemKind, OfferFields, TABLES, createRecord } from "@/lib/airtable";

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

  const offer = await createRecord<OfferFields>(TABLES.offers, {
    "Offer Name": name,
    Tagline: body.tagline || undefined,
    Description: body.description || undefined,
    "Default Contract Terms": body.contractTerms || undefined,
    "Payment Plan Options": Array.isArray(body.paymentPlans) ? body.paymentPlans : undefined,
  });

  await Promise.all(
    lineItems
      .filter((item) => item.description?.trim())
      .map((item) =>
        createRecord(TABLES.offerLineItems, {
          Offer: [offer.id],
          Description: item.description,
          Kind: item.kind,
          Quantity: item.quantity,
          "Unit Price": item.unitPrice,
        })
      )
  );

  return NextResponse.json({ id: offer.id });
}
