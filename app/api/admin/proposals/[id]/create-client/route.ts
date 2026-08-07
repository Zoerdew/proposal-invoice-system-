import { NextRequest, NextResponse } from "next/server";
import { getProposal } from "@/lib/db/proposals";
import { getLineItemsForProposal, getIncludedLineItems } from "@/lib/db/lineItems";
import { createClientFromProposal, getClientByProposalId } from "@/lib/db/clients";
import { sendOnboardingEmail } from "@/lib/email";

const ELIGIBLE_STATUSES = ["Signed", "Invoiced", "Paid"];

// Manual retry for the best-effort step in /api/sign: client creation and
// the onboarding email never roll back a signature, so if either failed
// (or nothing has been sent yet), this is how it gets a second attempt.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const proposal = await getProposal(id).catch(() => null);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (!ELIGIBLE_STATUSES.includes(proposal.status)) {
    return NextResponse.json(
      { error: "This proposal hasn't been signed yet." },
      { status: 409 }
    );
  }

  let client = await getClientByProposalId(proposal.id);
  if (!client) {
    const lineItems = await getLineItemsForProposal(proposal.id);
    const total = getIncludedLineItems(lineItems).reduce((sum, item) => sum + item.lineTotal, 0);
    client = await createClientFromProposal({
      proposalId: proposal.id,
      clientName: proposal.clientName,
      clientEmail: proposal.clientEmail,
      businessName: proposal.company,
      packagePrice: total,
      paymentPlan: proposal.paymentPlan,
    });
  }

  const onboardingUrl = new URL(`/c/${client.portalToken}/onboarding`, request.nextUrl.origin).toString();
  await sendOnboardingEmail({
    to: client.email,
    firstName: client.firstName,
    onboardingUrl,
  });

  return NextResponse.json({ ok: true, portalToken: client.portalToken });
}
