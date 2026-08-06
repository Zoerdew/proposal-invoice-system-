import { NextRequest, NextResponse } from "next/server";
import { LineItemKind, ProposalStatus } from "@/lib/db/shared";
import { getProposal, updateProposal } from "@/lib/db/proposals";
import { replaceLineItems } from "@/lib/db/lineItems";

interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

const LOCKED_STATUSES: ProposalStatus[] = ["Signed", "Invoiced", "Paid"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const proposal = await getProposal(id).catch(() => null);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (LOCKED_STATUSES.includes(proposal.status)) {
    return NextResponse.json(
      { error: "This proposal has already been signed and can no longer be edited." },
      { status: 409 }
    );
  }

  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const contractTerms = typeof body.contractTerms === "string" ? body.contractTerms : "";
  // A client picking an offer from the dropdown doesn't pull in its contract
  // terms — that only happens via the separate "Load" button. Without this
  // check it's possible to send a client a proposal with no terms at all.
  if (body.markSent && !contractTerms.trim()) {
    return NextResponse.json(
      { error: "Contract terms can't be empty before sending." },
      { status: 400 }
    );
  }
  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  const updated = await updateProposal(id, {
    clientName,
    clientEmail: body.clientEmail || null,
    company: body.company || null,
    contractTerms: body.contractTerms || null,
    offerId: body.offerId || null,
    // null (not undefined) so clearing the field in the form actually clears
    // it, rather than leaving a stale deposit amount in place.
    depositAmount: typeof body.depositAmount === "number" ? body.depositAmount : null,
    ...(body.markSent && proposal.status === "Draft" ? { status: "Sent" as const } : {}),
  });

  await replaceLineItems(
    id,
    lineItems.filter((item) => item.description?.trim())
  );

  return NextResponse.json({
    proposalLink: updated.proposalLink,
  });
}
