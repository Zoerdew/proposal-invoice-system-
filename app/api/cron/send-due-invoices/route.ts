import { NextRequest, NextResponse } from "next/server";
import {
  ProposalFields,
  ProposalInvoiceFields,
  TABLES,
  getRecord,
  listAll,
  updateRecord,
} from "@/lib/airtable";
import { currency } from "@/lib/currency";
import { createXeroInvoice, getSalesAccountCode } from "@/lib/xero";
import { sendSlackAlert } from "@/lib/slack";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Runs daily via vercel.json. Picks up instalments #2+ (created with blank
// Xero fields by /api/select-options) as their due date approaches, and
// only then actually creates + emails them in Xero — see the plan in
// lib/paymentPlans.ts for why creation itself is deferred, not just sending.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leadDays = Number(process.env.XERO_INVOICE_LEAD_DAYS) || 3;
  const cutoff = new Date(Date.now() + leadDays * 24 * 60 * 60 * 1000);

  const pending = await listAll<ProposalInvoiceFields>(
    TABLES.proposalInvoices,
    `{Xero Invoice ID} = ''`
  );
  const due = pending.filter((invoice) => {
    const dueDate = invoice.fields["Due Date"];
    return dueDate ? new Date(dueDate).getTime() <= cutoff.getTime() : false;
  });

  const accountCode = getSalesAccountCode();
  let processed = 0;
  const errors: string[] = [];

  for (const invoice of due) {
    const proposalId = invoice.fields.Proposal?.[0];
    if (!proposalId) continue;

    const amount = currency.format(invoice.fields.Amount ?? 0);
    const dueDateLabel = invoice.fields["Due Date"]
      ? dateFormat.format(new Date(invoice.fields["Due Date"]))
      : "unknown date";
    const label = invoice.fields.Description || `installment ${invoice.id}`;

    try {
      const proposal = await getRecord<ProposalFields>(TABLES.proposals, proposalId);
      const { invoiceId, onlineInvoiceUrl } = await createXeroInvoice(
        proposal,
        [
          {
            Description: invoice.fields.Description || proposal.fields["Client Name"],
            Quantity: 1,
            UnitAmount: invoice.fields.Amount ?? 0,
            AccountCode: accountCode,
          },
        ],
        invoice.fields["Due Date"] ?? new Date().toISOString().slice(0, 10)
      );
      await updateRecord<ProposalInvoiceFields>(TABLES.proposalInvoices, invoice.id, {
        "Xero Invoice ID": invoiceId,
        "Xero Online Invoice URL": onlineInvoiceUrl,
      });
      processed++;
      await sendSlackAlert(
        `✅ Instalment invoice sent — *${label}*, ${amount}, due ${dueDateLabel}. Worth a quick check in Xero: ${onlineInvoiceUrl || "(no online link returned)"}`
      );
    } catch (err) {
      console.error(`Failed to send installment invoice ${invoice.id}:`, err);
      errors.push(invoice.id);
      await sendSlackAlert(
        `⚠️ Instalment invoice *FAILED* to send — *${label}*, ${amount}, due ${dueDateLabel}. Check Xero and the Proposal Invoices table (row ${invoice.id}). Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return NextResponse.json({ processed, total: due.length, errors });
}
