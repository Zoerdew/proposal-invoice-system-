import { NextRequest, NextResponse } from "next/server";
import { getProposalBySlug, updateProposal } from "@/lib/db/proposals";
import { getLineItemsForProposal, setLineItemSelected } from "@/lib/db/lineItems";
import { getAvailablePaymentPlans, getOfferForProposal } from "@/lib/db/offers";
import {
  createProposalInvoice,
  deleteProposalInvoicesForProposal,
  getProposalInvoices,
} from "@/lib/db/proposalInvoices";
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
  if (proposal.status !== "Sent" && proposal.status !== "Viewed") {
    return NextResponse.json(
      { error: "This proposal has already been signed." },
      { status: 409 }
    );
  }

  const lineItems = await getLineItemsForProposal(proposal.id);
  const options = lineItems.filter((item) => item.kind === "Package Option");

  if (options.length > 0 && !options.some((o) => o.id === selectedOptionId)) {
    return NextResponse.json(
      { error: "Please choose one of the package options." },
      { status: 400 }
    );
  }

  const offer = await getOfferForProposal(proposal.offerId);
  const availablePlans = getAvailablePaymentPlans(offer);
  const plan: PaymentPlan =
    availablePlans.length > 1 && availablePlans.includes(submittedPlan as PaymentPlan)
      ? (submittedPlan as PaymentPlan)
      : availablePlans[0];

  await Promise.all(
    lineItems
      .filter((item) => item.kind === "Package Option" || item.kind === "Add-on")
      .map((item) => {
        const selected =
          item.kind === "Package Option"
            ? item.id === selectedOptionId
            : selectedAddonIds.includes(item.id);
        return setLineItemSelected(item.id, selected);
      })
  );

  const total = lineItems
    .filter((item) => {
      if (item.kind === "Fixed") return true;
      if (item.kind === "Package Option") return item.id === selectedOptionId;
      return selectedAddonIds.includes(item.id);
    })
    .reduce((sum, item) => sum + item.lineTotal, 0);

  // Pin the schedule down once, here — never recomputed later, so the
  // contract text and the actual Xero invoices (one now, the rest via the
  // cron job) can never drift apart.
  const installments = computeInstallments(
    total,
    plan,
    getFirstDueDate(),
    proposal.depositAmount ?? undefined
  );

  const proposalUpdate: { status?: "Viewed"; paymentPlan?: PaymentPlan; contractTerms?: string } = {
    paymentPlan: plan,
  };
  if (proposal.status === "Sent") {
    proposalUpdate.status = "Viewed";
  }

  // The client can revisit page 1 and pick a different plan before signing,
  // or the price can change (a discount, a corrected line item) between
  // visits. Idempotent: read back whatever schedule is already stored (if
  // any) to reconstruct the *exact* total and sentence currently baked into
  // the text, and replace those — no guessing, since both are read from
  // what's actually stored rather than recomputed from (possibly since-
  // mutated) line item state.
  const existingInvoices = await getProposalInvoices(proposal.id);

  if (proposal.contractTerms) {
    let terms = proposal.contractTerms;
    if (existingInvoices.length > 0) {
      const oldInstallments: Installment[] = existingInvoices.map((inv) => ({
        sequence: inv.sequence,
        amount: inv.amount,
        dueDate: inv.dueDate,
      }));
      terms = terms.split(describePaymentPlan(oldInstallments)).join("{{Payment Plan}}");

      const oldTotal = existingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      terms = terms.split(currency.format(oldTotal)).join("{{Total}}");
    }
    terms = resolveTotalPlaceholder(terms, currency.format(total));
    proposalUpdate.contractTerms = resolvePaymentPlanPlaceholder(
      terms,
      describePaymentPlan(installments)
    );
  }

  // Replace any previously-scheduled installments with the fresh set.
  await deleteProposalInvoicesForProposal(proposal.id);
  await Promise.all(
    installments.map((installment) =>
      createProposalInvoice({
        proposalId: proposal.id,
        sequence: installment.sequence,
        amount: installment.amount,
        dueDate: installment.dueDate,
        description: `${proposal.clientName} — Payment ${installment.sequence} of ${installments.length}`,
      })
    )
  );

  await updateProposal(proposal.id, proposalUpdate);

  return NextResponse.json({ ok: true });
}
