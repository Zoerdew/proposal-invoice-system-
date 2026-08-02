import { NextRequest, NextResponse } from "next/server";
import {
  LineItemKind,
  ProposalFields,
  TABLES,
  createRecord,
  deleteRecords,
  getLineItemsForProposal,
  getRecord,
  updateRecord,
} from "@/lib/airtable";

interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

const LOCKED_STATUSES = ["Signed", "Invoiced", "Paid"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const proposal = await getRecord<ProposalFields>(TABLES.proposals, id).catch(() => null);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (LOCKED_STATUSES.includes(proposal.fields.Status ?? "")) {
    return NextResponse.json(
      { error: "This proposal has already been signed and can no longer be edited." },
      { status: 409 }
    );
  }

  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  const updateFields: Partial<ProposalFields> = {
    "Client Name": clientName,
    "Client Email": body.clientEmail || undefined,
    Company: body.company || undefined,
    "Contract Terms": body.contractTerms || undefined,
    Offer: body.offerId ? [body.offerId] : undefined,
  };
  if (body.markSent && proposal.fields.Status === "Draft") {
    updateFields.Status = "Sent";
  }

  const updated = await updateRecord<ProposalFields>(TABLES.proposals, id, updateFields);

  const existingLineItems = await getLineItemsForProposal(proposal);
  await deleteRecords(
    TABLES.lineItems,
    existingLineItems.map((item) => item.id)
  );
  await Promise.all(
    lineItems
      .filter((item) => item.description?.trim())
      .map((item) =>
        createRecord(TABLES.lineItems, {
          Proposal: [id],
          Description: item.description,
          Kind: item.kind,
          Quantity: item.quantity,
          "Unit Price": item.unitPrice,
        })
      )
  );

  return NextResponse.json({
    proposalLink: updated.fields["Proposal Link"] ?? null,
  });
}
