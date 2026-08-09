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
        <div className="card-brutal p-8">
          <h1 className="font-heading font-[800] text-xl mb-2">
            This proposal isn&apos;t ready yet
          </h1>
          <p className="text-[#0a0608]/60">Check back once it&apos;s been sent to you.</p>
        </div>
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
    <header className="mb-8 flex flex-col items-start gap-3">
      <span className="eyebrow-pill">Proposal</span>
      <h1 className="font-heading font-[800] text-3xl md:text-4xl leading-[1.02] tracking-[-0.03em]">
        {proposal.clientName}
        {proposal.company ? (
          <>
            {" "}
            <span className="text-accent">· {proposal.company}</span>
          </>
        ) : (
          ""
        )}
      </h1>
    </header>
  );

  const offerContent = offer && (offer.tagline || offer.description) && (
    <section className="mb-8 card-brutal p-6">
      <h2 className="font-heading font-[800] text-xl">{offer.name}</h2>
      {offer.tagline && <p className="mt-1 font-medium text-accent">{offer.tagline}</p>}
      {offer.description && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-[#0a0608]/80">{offer.description}</p>
      )}
    </section>
  );

  const fixedList = fixedItems.length > 0 && (
    <ul className="mb-6 card-brutal divide-y-2 divide-[#0a0608]/10 p-0 overflow-hidden">
      {fixedItems.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-6 py-4 text-sm">
          <span>{item.description}</span>
          <span className="font-heading font-[800]">{currency.format(item.lineTotal)}</span>
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
        <p className="mb-6 text-[#0a0608]/60">You&apos;ve already signed this proposal.</p>
        <Link href={`/proposal/${slug}/invoice`} className="btn-pill px-6 py-3 text-sm">
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
