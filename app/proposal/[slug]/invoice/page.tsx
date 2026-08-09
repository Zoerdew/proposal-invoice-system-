import { notFound } from "next/navigation";
import Link from "next/link";
import { getProposalBySlug } from "@/lib/db/proposals";
import { getProposalInvoices } from "@/lib/db/proposalInvoices";
import StepNav from "../StepNav";
import InvoiceStatus from "./InvoiceStatus";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = await getProposalBySlug(slug);
  if (!proposal) notFound();

  const status = proposal.status;

  if (status !== "Signed" && status !== "Invoiced" && status !== "Paid") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="card-brutal p-8 flex flex-col items-center gap-3">
          <h1 className="font-heading font-[800] text-xl">Sign the contract first</h1>
          <p className="text-[#0a0608]/60">
            You&apos;ll see your invoice here once the contract is signed.
          </p>
          <Link href={`/proposal/${slug}/contract`} className="btn-pill px-6 py-3 text-sm">
            Go to contract
          </Link>
        </div>
      </main>
    );
  }

  const invoices = await getProposalInvoices(proposal.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <StepNav current="invoice" />
      <header className="mb-8 flex flex-col items-start gap-3">
        <span className="eyebrow-pill">Invoice</span>
        <h1 className="font-heading font-[800] text-3xl md:text-4xl leading-[1.02] tracking-[-0.03em]">
          {proposal.clientName}
        </h1>
      </header>

      <InvoiceStatus
        slug={slug}
        initialStatus={status}
        initialInvoices={invoices.map((invoice) => ({
          sequence: invoice.sequence,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          url: invoice.xeroOnlineInvoiceUrl,
        }))}
      />
    </main>
  );
}
