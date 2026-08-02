import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  computeTotal,
  getIncludedLineItems,
  getLineItemsForProposal,
  getProposalBySlug,
} from "@/lib/airtable";
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

  const status = proposal.fields.Status ?? "Draft";

  if (status === "Draft") {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-xl font-extrabold text-brand-ink">
          This proposal isn&apos;t ready yet
        </h1>
        <p className="text-brand-ink/60">Check back once it&apos;s been sent to you.</p>
      </main>
    );
  }

  const lineItems = await getLineItemsForProposal(proposal);
  const hasOptions = lineItems.some((item) => item.fields.Kind === "Package Option");
  const hasChosenOption = lineItems.some(
    (item) => item.fields.Kind === "Package Option" && item.fields.Selected
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
        <h1 className="mb-6 text-2xl font-extrabold text-brand-ink">Contract</h1>
        <p className="mb-6 text-brand-ink/60">You&apos;ve already signed this proposal.</p>
        <Link
          href={`/proposal/${slug}/invoice`}
          className="inline-block rounded-full bg-brand-pink px-6 py-3 font-extrabold text-white hover:opacity-90"
        >
          View invoice
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <StepNav current="contract" />
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-pink">Contract</p>
        <h1 className="text-2xl font-extrabold text-brand-ink">
          {proposal.fields["Client Name"]}
        </h1>
      </header>

      <section className="mb-8 overflow-hidden rounded-2xl border border-brand-ink/10 bg-white">
        <table className="w-full text-sm">
          <tbody>
            {included.map((item) => (
              <tr key={item.id} className="border-b border-brand-ink/10 last:border-0">
                <td className="px-4 py-3">{item.fields.Description}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {currency.format(item.fields["Line Total"] ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-brand-ink/10">
              <td className="px-4 py-3 font-extrabold text-brand-ink">Total</td>
              <td className="px-4 py-3 text-right font-extrabold text-brand-pink">
                {currency.format(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {proposal.fields["Contract Terms"] && (
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-extrabold text-brand-ink">Terms</h2>
          <p className="whitespace-pre-wrap text-sm text-brand-ink/70">
            {proposal.fields["Contract Terms"]}
          </p>
        </section>
      )}

      <SignatureForm slug={slug} />
    </main>
  );
}
