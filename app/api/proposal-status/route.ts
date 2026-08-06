import { NextRequest, NextResponse } from "next/server";
import { getProposalBySlug } from "@/lib/db/proposals";
import { getProposalInvoices } from "@/lib/db/proposalInvoices";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const proposal = await getProposalBySlug(slug);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const invoices = await getProposalInvoices(proposal.id);

  return NextResponse.json({
    status: proposal.status,
    invoices: invoices.map((invoice) => ({
      sequence: invoice.sequence,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      url: invoice.xeroOnlineInvoiceUrl ?? null,
    })),
  });
}
