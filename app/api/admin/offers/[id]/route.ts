import { NextRequest, NextResponse } from "next/server";
import {
  LineItemKind,
  OfferFields,
  TABLES,
  createRecord,
  deleteRecords,
  getOffer,
  getOfferLineItems,
  updateRecord,
} from "@/lib/airtable";

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
  const lineItems = await getOfferLineItems(offer);

  return NextResponse.json({
    contractTerms: offer.fields["Default Contract Terms"] ?? "",
    rows: lineItems.map((item) => ({
      description: item.fields.Description ?? "",
      kind: item.fields.Kind ?? "Fixed",
      quantity: item.fields.Quantity ?? 1,
      unitPrice: item.fields["Unit Price"] ?? 0,
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

  await updateRecord<OfferFields>(TABLES.offers, id, {
    "Offer Name": name,
    Tagline: body.tagline || undefined,
    Description: body.description || undefined,
    "Default Contract Terms": body.contractTerms || undefined,
    "Payment Plan Options": Array.isArray(body.paymentPlans) ? body.paymentPlans : undefined,
  });

  const existing = await getOfferLineItems(offer);
  await deleteRecords(
    TABLES.offerLineItems,
    existing.map((item) => item.id)
  );
  await Promise.all(
    lineItems
      .filter((item) => item.description?.trim())
      .map((item) =>
        createRecord(TABLES.offerLineItems, {
          Offer: [id],
          Description: item.description,
          Kind: item.kind,
          Quantity: item.quantity,
          "Unit Price": item.unitPrice,
        })
      )
  );

  return NextResponse.json({ ok: true });
}
