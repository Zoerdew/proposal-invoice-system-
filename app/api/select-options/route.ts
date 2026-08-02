import { NextRequest, NextResponse } from "next/server";
import {
  ProposalInvoiceFields,
  TABLES,
  createRecord,
  deleteRecords,
  getAvailablePaymentPlans,
  getLineItemsForProposal,
  getOfferForProposal,
  getProposalBySlug,
  getProposalInvoices,
  updateRecord,
} from "@/lib/airtable";
import {
  Installment,
  PaymentPlan,
  computeInstallments,
  describePaymentPlan,
  getFirstDueDate,
} from "@/lib/paymentPlans";
import { resolvePaymentPlanPlaceholder, resolveTotalPlaceholder } from "@/lib/placeholders";
import { currency } from "@/lib/currency";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const slug = typeof body.slug === "string" ? body.slug : "";
  const selectedOptionId =
    typeof body.selectedOptionId === "string" ? body.selectedOptionId : null;
  const selectedAddonIds: string[] = Array.isArray(body.selectedAddonIds)
    ? body.selectedAddonIds.filter((id: unknown) => typeof id === "string")
    : [];
  const submittedPlan: string | null =
    typeof body.paymentPlan === "string" ? body.paymentPlan : null;

  if (!slug) {
    return NextResponse.json({ error: "Missing proposal." }, { status: 400 });
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

  const lineItems = await getLineItemsForProposal(proposal);
  const options = lineItems.filter((item) => item.fields.Kind === "Package Option");

  if (options.length > 0 && !options.some((o) => o.id === selectedOptionId)) {
    return NextResponse.json(
      { error: "Please choose one of the package options." },
      { status: 400 }
    );
  }

  const offer = await getOfferForProposal(proposal);
  const availablePlans = getAvailablePaymentPlans(offer);
  const plan: PaymentPlan =
    availablePlans.length > 1 && availablePlans.includes(submittedPlan as PaymentPlan)
      ? (submittedPlan as PaymentPlan)
      : availablePlans[0];

  await Promise.all(
    lineItems
      .filter((item) => item.fields.Kind === "Package Option" || item.fields.Kind === "Add-on")
      .map((item) => {
        const selected =
          item.fields.Kind === "Package Option"
            ? item.id === selectedOptionId
            : selectedAddonIds.includes(item.id);
        return updateRecord(TABLES.lineItems, item.id, { Selected: selected });
      })
  );

  const total = lineItems
    .filter((item) => {
      const kind = item.fields.Kind ?? "Fixed";
      if (kind === "Fixed") return true;
      if (kind === "Package Option") return item.id === selectedOptionId;
      return selectedAddonIds.includes(item.id);
    })
    .reduce((sum, item) => sum + (item.fields["Line Total"] ?? 0), 0);

  // Pin the schedule down once, here — never recomputed later, so the
  // contract text and the actual Xero invoices (one now, the rest via the
  // cron job) can never drift apart.
  const installments = computeInstallments(total, plan, getFirstDueDate());

  const proposalUpdate: { Status?: "Viewed"; "Payment Plan"?: PaymentPlan; "Contract Terms"?: string } = {
    "Payment Plan": plan,
  };
  if (proposal.fields.Status === "Sent") {
    proposalUpdate.Status = "Viewed";
  }

  // The client can revisit page 1 and pick a different plan before signing,
  // or the price can change (a discount, a corrected line item) between
  // visits. Idempotent: read back whatever schedule is already stored (if
  // any) to reconstruct the *exact* total and sentence currently baked into
  // the text, and replace those — no guessing, since both are read from
  // what's actually stored rather than recomputed from (possibly since-
  // mutated) line item state.
  const existingInvoices = await getProposalInvoices(proposal);

  if (proposal.fields["Contract Terms"]) {
    let terms = proposal.fields["Contract Terms"];
    if (existingInvoices.length > 0) {
      const oldInstallments: Installment[] = existingInvoices.map((inv) => ({
        sequence: inv.fields.Sequence ?? 0,
        amount: inv.fields.Amount ?? 0,
        dueDate: inv.fields["Due Date"] ?? "",
      }));
      terms = terms.split(describePaymentPlan(oldInstallments)).join("{{Payment Plan}}");

      const oldTotal = existingInvoices.reduce((sum, inv) => sum + (inv.fields.Amount ?? 0), 0);
      terms = terms.split(currency.format(oldTotal)).join("{{Total}}");
    }
    terms = resolveTotalPlaceholder(terms, currency.format(total));
    proposalUpdate["Contract Terms"] = resolvePaymentPlanPlaceholder(
      terms,
      describePaymentPlan(installments)
    );
  }

  // Replace any previously-scheduled installments with the fresh set.
  await deleteRecords(
    TABLES.proposalInvoices,
    existingInvoices.map((inv) => inv.id)
  );
  await Promise.all(
    installments.map((installment) =>
      createRecord<ProposalInvoiceFields>(TABLES.proposalInvoices, {
        Proposal: [proposal.id],
        Sequence: installment.sequence,
        Amount: installment.amount,
        "Due Date": installment.dueDate,
        Description: `${proposal.fields["Client Name"]} — Payment ${installment.sequence} of ${installments.length}`,
      })
    )
  );

  await updateRecord(TABLES.proposals, proposal.id, proposalUpdate);

  return NextResponse.json({ ok: true });
}
