import { NextRequest, NextResponse } from "next/server";
import { getProposal } from "@/lib/db/proposals";
import { listPendingInvoices, updateProposalInvoiceXero } from "@/lib/db/proposalInvoices";
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

  const pending = await listPendingInvoices();
  const due = pending.filter((invoice) => new Date(invoice.dueDate).getTime() <= cutoff.getTime());

  const accountCode = getSalesAccountCode();
  let processed = 0;
  const errors: string[] = [];

  for (const invoice of due) {
    const amount = currency.format(invoice.amount);
    const dueDateLabel = dateFormat.format(new Date(invoice.dueDate));
    const label = invoice.description || `installment ${invoice.id}`;

    try {
      const proposal = await getProposal(invoice.proposalId);
      const { invoiceId, onlineInvoiceUrl } = await createXeroInvoice(
        proposal,
        [
          {
            Description: invoice.description || proposal.clientName,
            Quantity: 1,
            UnitAmount: invoice.amount,
            AccountCode: accountCode,
          },
        ],
        invoice.dueDate
      );
      await updateProposalInvoiceXero(invoice.id, {
        xeroInvoiceId: invoiceId,
        xeroOnlineInvoiceUrl: onlineInvoiceUrl,
      });
      processed++;
      await sendSlackAlert(
        `✅ Instalment invoice sent — *${label}*, ${amount}, due ${dueDateLabel}. Worth a quick check in Xero: ${onlineInvoiceUrl || "(no online link returned)"}`
      );
    } catch (err) {
      console.error(`Failed to send installment invoice ${invoice.id}:`, err);
      errors.push(invoice.id);
      await sendSlackAlert(
        `⚠️ Instalment invoice *FAILED* to send — *${label}*, ${amount}, due ${dueDateLabel}. Check Xero and the proposal_invoices table (row ${invoice.id}). Error: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  return NextResponse.json({ processed, total: due.length, errors });
}
