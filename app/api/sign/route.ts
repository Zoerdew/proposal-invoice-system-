import { NextRequest, NextResponse } from "next/server";
import {
  ProposalInvoiceFields,
  TABLES,
  createRecord,
  getIncludedLineItems,
  getLineItemsForProposal,
  getProposalBySlug,
  getProposalInvoices,
  updateRecord,
} from "@/lib/airtable";
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
  if (proposal.fields.Status !== "Sent" && proposal.fields.Status !== "Viewed") {
    return NextResponse.json(
      { error: "This proposal has already been signed." },
      { status: 409 }
    );
  }

  const lineItemsBeforeSign = await getLineItemsForProposal(proposal);
  const hasOptions = lineItemsBeforeSign.some((item) => item.fields.Kind === "Package Option");
  const hasChosenOption = lineItemsBeforeSign.some(
    (item) => item.fields.Kind === "Package Option" && item.fields.Selected
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

  await createRecord(TABLES.signatures, {
    Proposal: [proposal.id],
    "Signed Name": signedName,
    "Signed At": new Date().toISOString(),
    "IP Address": ip,
    Confirmed: true,
  });

  const now = new Date().toISOString().slice(0, 10);
  await updateRecord(TABLES.proposals, proposal.id, {
    Status: "Signed",
    "Date Signed": now,
  });

  // Best-effort: the client polls /api/proposal-status regardless of whether
  // this succeeds immediately, so a slow or not-yet-connected Xero doesn't
  // block confirming the signature itself.
  try {
    const invoiceLineItems = getIncludedLineItems(lineItemsBeforeSign);
    const accountCode = getSalesAccountCode();
    const proposalForXero = { ...proposal, fields: { ...proposal.fields, Status: "Signed" as const } };

    // The schedule was already pinned down in /api/select-options — read it
    // back rather than recomputing, so it can never drift from the contract.
    let schedule = await getProposalInvoices(proposal);
    if (schedule.length === 0) {
      // Edge case: select-options never ran (e.g. a direct link straight to
      // the contract page on a proposal with no options to force page 1).
      // Fall back to a fresh single Pay-in-Full installment.
      const total = invoiceLineItems.reduce(
        (sum, item) => sum + (item.fields["Line Total"] ?? 0),
        0
      );
      const [only] = computeInstallments(total, "Pay in Full", getFirstDueDate());
      const created = await createRecord<ProposalInvoiceFields>(TABLES.proposalInvoices, {
        Proposal: [proposal.id],
        Sequence: only.sequence,
        Amount: only.amount,
        "Due Date": only.dueDate,
        Description: proposal.fields["Client Name"] ?? "",
      });
      schedule = [created];
    }

    const [first, ...rest] = schedule;
    const firstLineItems: XeroLineItem[] =
      rest.length === 0
        ? invoiceLineItems.map((item) => ({
            Description: item.fields.Description,
            Quantity: item.fields.Quantity ?? 1,
            UnitAmount: item.fields["Unit Price"] ?? 0,
            AccountCode: accountCode,
          }))
        : [
            {
              Description: first.fields.Description || proposal.fields["Client Name"],
              Quantity: 1,
              UnitAmount: first.fields.Amount ?? 0,
              AccountCode: accountCode,
            },
          ];

    const { invoiceId, onlineInvoiceUrl } = await createXeroInvoice(
      proposalForXero,
      firstLineItems,
      first.fields["Due Date"] ?? now
    );
    await updateRecord<ProposalInvoiceFields>(TABLES.proposalInvoices, first.id, {
      "Xero Invoice ID": invoiceId,
      "Xero Online Invoice URL": onlineInvoiceUrl,
    });

    await updateRecord(TABLES.proposals, proposal.id, { Status: "Invoiced" });
  } catch (err) {
    console.error("Xero invoice creation failed after signing:", err);
  }

  return NextResponse.json({ ok: true });
}
