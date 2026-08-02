import { NextRequest, NextResponse } from "next/server";
import { getProposalBySlug, getProposalInvoices } from "@/lib/airtable";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const proposal = await getProposalBySlug(slug);
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  const invoices = await getProposalInvoices(proposal);

  return NextResponse.json({
    status: proposal.fields.Status,
    invoices: invoices.map((invoice) => ({
      sequence: invoice.fields.Sequence,
      amount: invoice.fields.Amount,
      dueDate: invoice.fields["Due Date"],
      url: invoice.fields["Xero Online Invoice URL"] ?? null,
    })),
  });
}
