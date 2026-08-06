import { notFound } from "next/navigation";
import Link from "next/link";
import { getProposalBySlug } from "@/lib/db/proposals";
import { getLineItemsForProposal } from "@/lib/db/lineItems";
import { getAvailablePaymentPlans, getOfferForProposal } from "@/lib/db/offers";
import { currency } from "@/lib/currency";
import OptionsForm from "./OptionsForm";
import StepNav from "./StepNav";

export const dynamic = "force-dynamic";

export default async function ProposalPage({
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
        <h1 className="text-xl font-extrabold text-brand-ink">
          This proposal isn&apos;t ready yet
        </h1>
        <p className="text-brand-ink/60">Check back once it&apos;s been sent to you.</p>
      </main>
    );
  }

  const [lineItems, offer] = await Promise.all([
    getLineItemsForProposal(proposal.id),
    getOfferForProposal(proposal.offerId),
  ]);
  const fixedItems = lineItems.filter((item) => item.kind === "Fixed");
  const packageOptions = lineItems.filter((item) => item.kind === "Package Option");
  const addons = lineItems.filter((item) => item.kind === "Add-on");
  const fixedTotal = fixedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const availablePlans = getAvailablePaymentPlans(offer);

  const header = (
    <header className="mb-8">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-pink">Proposal</p>
      <h1 className="text-2xl font-extrabold text-brand-ink">
        {proposal.clientName}
        {proposal.company ? ` · ${proposal.company}` : ""}
      </h1>
    </header>
  );

  const offerContent = offer && (offer.tagline || offer.description) && (
    <section className="mb-8 rounded-2xl border border-brand-ink/10 bg-white p-6">
      <h2 className="text-xl font-extrabold text-brand-ink">{offer.name}</h2>
      {offer.tagline && <p className="mt-1 font-medium text-brand-pink">{offer.tagline}</p>}
      {offer.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-brand-ink/80">{offer.description}</p>
      )}
    </section>
  );

  const fixedList = fixedItems.length > 0 && (
    <ul className="mb-6 divide-y divide-brand-ink/10 rounded-2xl border border-brand-ink/10 bg-white">
      {fixedItems.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>{item.description}</span>
          <span className="font-extrabold">{currency.format(item.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );

  if (status !== "Sent" && status !== "Viewed") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <StepNav current="proposal" />
        {header}
        {offerContent}
        {fixedList}
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
      <StepNav current="proposal" />
      {header}
      {offerContent}
      {fixedList}
      <OptionsForm
        slug={slug}
        fixedTotal={fixedTotal}
        packageOptions={packageOptions.map((o) => ({
          id: o.id,
          description: o.description,
          lineTotal: o.lineTotal,
        }))}
        addons={addons.map((a) => ({
          id: a.id,
          description: a.description,
          lineTotal: a.lineTotal,
        }))}
        paymentPlans={availablePlans}
      />
    </main>
  );
}
