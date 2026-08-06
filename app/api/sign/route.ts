import { NextRequest, NextResponse } from "next/server";
import { getProposalBySlug, updateProposal } from "@/lib/db/proposals";
import { getIncludedLineItems, getLineItemsForProposal } from "@/lib/db/lineItems";
import {
  createProposalInvoice,
  getProposalInvoices,
  updateProposalInvoiceXero,
} from "@/lib/db/proposalInvoices";
import { createSignature } from "@/lib/db/signatures";
import { computeInstallments, getFirstDueDate } from "@/lib/paymentPlans";
import { XeroLineItem, createXeroInvoice, getSalesAccountCode } from "@/lib/xero";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const slug = typeof body.slug === "string" ? body.slug : "";
  const signedName = typeof body.signedName === "string" ? body.signedName.trim() : "";
  const confirmed = body.confirmed === true;

  if (!slug || !signedName || !confirmed) {
    return NextResponse.json(
      { error: "Missing name, confirmation, or proposal." },
      { status: 400 }
    );
  }

  const proposal = await getProposalBySlug(slug);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  if (proposal.status !== "Sent" && proposal.status !== "Viewed") {
    return NextResponse.json(
      { error: "This proposal has already been signed." },
      { status: 409 }
    );
  }

  const lineItemsBeforeSign = await getLineItemsForProposal(proposal.id);
  const hasOptions = lineItemsBeforeSign.some((item) => item.kind === "Package Option");
  const hasChosenOption = lineItemsBeforeSign.some(
    (item) => item.kind === "Package Option" && item.selected
  );
  if (hasOptions && !hasChosenOption) {
    return NextResponse.json(
      { error: "Please choose a package option before signing." },
      { status: 400 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  await createSignature({
    proposalId: proposal.id,
    signedName,
    ipAddress: ip,
    confirmed: true,
  });

  const now = new Date().toISOString().slice(0, 10);
  await updateProposal(proposal.id, {
    status: "Signed",
    dateSigned: now,
  });

  // Best-effort: the client polls /api/proposal-status regardless of whether
  // this succeeds immediately, so a slow or not-yet-connected Xero doesn't
  // block confirming the signature itself.
  try {
    const invoiceLineItems = getIncludedLineItems(lineItemsBeforeSign);
    const accountCode = getSalesAccountCode();
    const proposalForXero = { ...proposal, status: "Signed" as const };

    // The schedule was already pinned down in /api/select-options — read it
    // back rather than recomputing, so it can never drift from the contract.
    let schedule = await getProposalInvoices(proposal.id);
    if (schedule.length === 0) {
      // Edge case: select-options never ran (e.g. a direct link straight to
      // the contract page on a proposal with no options to force page 1).
      // Fall back to a fresh single Pay-in-Full installment.
      const total = invoiceLineItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const [only] = computeInstallments(total, "Pay in Full", getFirstDueDate());
      const created = await createProposalInvoice({
        proposalId: proposal.id,
        sequence: only.sequence,
        amount: only.amount,
        dueDate: only.dueDate,
        description: proposal.clientName,
      });
      schedule = [created];
    }

    const [first, ...rest] = schedule;
    const firstLineItems: XeroLineItem[] =
      rest.length === 0
        ? invoiceLineItems.map((item) => ({
            Description: item.description,
            Quantity: item.quantity,
            UnitAmount: item.unitPrice,
            AccountCode: accountCode,
          }))
        : [
            {
              Description: first.description || proposal.clientName,
              Quantity: 1,
              UnitAmount: first.amount,
              AccountCode: accountCode,
            },
          ];

    const { invoiceId, onlineInvoiceUrl } = await createXeroInvoice(
      proposalForXero,
      firstLineItems,
      first.dueDate || now
    );
    await updateProposalInvoiceXero(first.id, {
      xeroInvoiceId: invoiceId,
      xeroOnlineInvoiceUrl: onlineInvoiceUrl,
    });

    await updateProposal(proposal.id, { status: "Invoiced" });
  } catch (err) {
    console.error("Xero invoice creation failed after signing:", err);
  }

  return NextResponse.json({ ok: true });
}
