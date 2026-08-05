import { NextRequest, NextResponse } from "next/server";
import { LineItemKind, ProposalFields, TABLES, createRecord } from "@/lib/airtable";
import { ensureUniqueSlug, slugify } from "@/lib/slug";

interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  const slug = await ensureUniqueSlug(slugify(clientName));

  const proposal = await createRecord<ProposalFields>(TABLES.proposals, {
    "Client Name": clientName,
    "Client Email": body.clientEmail || undefined,
    Company: body.company || undefined,
    "Contract Terms": body.contractTerms || undefined,
    "Proposal Page Slug": slug,
    Offer: body.offerId ? [body.offerId] : undefined,
    "Deposit Amount": typeof body.depositAmount === "number" ? body.depositAmount : undefined,
    Status: "Draft",
  });

  await Promise.all(
    lineItems
      .filter((item) => item.description?.trim())
      .map((item) =>
        createRecord(TABLES.lineItems, {
          Proposal: [proposal.id],
          Description: item.description,
          Kind: item.kind,
          Quantity: item.quantity,
          "Unit Price": item.unitPrice,
        })
      )
  );

  return NextResponse.json({
    id: proposal.id,
    slug,
    proposalLink: proposal.fields["Proposal Link"] ?? null,
  });
}
