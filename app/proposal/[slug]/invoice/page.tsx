import { notFound } from "next/navigation";
import Link from "next/link";
import { getProposalBySlug, getProposalInvoices } from "@/lib/airtable";
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

  const status = proposal.fields.Status ?? "Draft";

  if (status !== "Signed" && status !== "Invoiced" && status !== "Paid") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-extrabold text-brand-ink">Sign the contract first</h1>
        <p className="text-brand-ink/60">
          You&apos;ll see your invoice here once the contract is signed.
        </p>
        <Link
          href={`/proposal/${slug}/contract`}
          className="inline-block rounded-full bg-brand-pink px-6 py-3 font-extrabold text-white hover:opacity-90"
        >
          Go to contract
        </Link>
      </main>
    );
  }

  const invoices = await getProposalInvoices(proposal);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <StepNav current="invoice" />
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-pink">Invoice</p>
        <h1 className="text-2xl font-extrabold text-brand-ink">
          {proposal.fields["Client Name"]}
        </h1>
      </header>

      <InvoiceStatus
        slug={slug}
        initialStatus={status}
        initialInvoices={invoices.map((invoice) => ({
          sequence: invoice.fields.Sequence ?? 0,
          amount: invoice.fields.Amount ?? 0,
          dueDate: invoice.fields["Due Date"] ?? "",
          url: invoice.fields["Xero Online Invoice URL"] ?? null,
        }))}
      />
    </main>
  );
}
