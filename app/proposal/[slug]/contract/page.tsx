import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getProposalBySlug } from "@/lib/db/proposals";
import { computeTotal, getIncludedLineItems, getLineItemsForProposal } from "@/lib/db/lineItems";
import { currency } from "@/lib/currency";
import StepNav from "../StepNav";
import SignatureForm from "./SignatureForm";

export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = await getProposalBySlug(slug);
  if (!proposal) notFound();

  const status = proposal.status;

  if (status === "Draft") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-2 px-6 text-center">
        <div className="card-brutal p-8">
          <h1 className="font-heading font-[800] text-xl mb-2">
            This proposal isn&apos;t ready yet
          </h1>
          <p className="text-[#0a0608]/60">Check back once it&apos;s been sent to you.</p>
        </div>
      </main>
    );
  }

  const lineItems = await getLineItemsForProposal(proposal.id);
  const hasOptions = lineItems.some((item) => item.kind === "Package Option");
  const hasChosenOption = lineItems.some(
    (item) => item.kind === "Package Option" && item.selected
  );

  if ((status === "Sent" || status === "Viewed") && hasOptions && !hasChosenOption) {
    redirect(`/proposal/${slug}`);
  }

  const included = getIncludedLineItems(lineItems);
  const total = computeTotal(included);

  if (status !== "Sent" && status !== "Viewed") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <StepNav current="contract" />
        <h1 className="mb-6 font-heading font-[800] text-2xl">Contract</h1>
        <p className="mb-6 text-[#0a0608]/60">You&apos;ve already signed this proposal.</p>
        <Link href={`/proposal/${slug}/invoice`} className="btn-pill px-6 py-3 text-sm">
          View invoice
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <StepNav current="contract" />
      <header className="mb-8 flex flex-col items-start gap-3">
        <span className="eyebrow-pill">Contract</span>
        <h1 className="font-heading font-[800] text-3xl md:text-4xl leading-[1.02] tracking-[-0.03em]">
          {proposal.clientName}
        </h1>
      </header>

      <section className="mb-8 card-brutal p-0 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {included.map((item) => (
              <tr key={item.id} className="border-b-2 border-[#0a0608]/10 last:border-0">
                <td className="px-6 py-4">{item.description}</td>
                <td className="px-6 py-4 text-right font-medium">
                  {currency.format(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#0a0608]/15">
              <td className="px-6 py-4 font-heading font-[800]">Total</td>
              <td className="px-6 py-4 text-right font-heading font-[800] text-accent">
                {currency.format(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {proposal.contractTerms && (
        <section className="mb-8 card-brutal-blush p-6">
          <h2 className="mb-2 text-lg font-heading font-[800]">Terms</h2>
          <p className="whitespace-pre-wrap text-sm text-[#0a0608]/70">
            {proposal.contractTerms}
          </p>
        </section>
      )}

      <SignatureForm slug={slug} />
    </main>
  );
}
