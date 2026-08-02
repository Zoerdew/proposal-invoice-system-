import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAvailablePaymentPlans,
  getLineItemsForProposal,
  getOfferForProposal,
  getProposalBySlug,
} from "@/lib/airtable";
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

  const [lineItems, offer] = await Promise.all([
    getLineItemsForProposal(proposal),
    getOfferForProposal(proposal),
  ]);
  const fixedItems = lineItems.filter((item) => (item.fields.Kind ?? "Fixed") === "Fixed");
  const packageOptions = lineItems.filter((item) => item.fields.Kind === "Package Option");
  const addons = lineItems.filter((item) => item.fields.Kind === "Add-on");
  const fixedTotal = fixedItems.reduce(
    (sum, item) => sum + (item.fields["Line Total"] ?? 0),
    0
  );
  const availablePlans = getAvailablePaymentPlans(offer);

  const header = (
    <header className="mb-8">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-pink">Proposal</p>
      <h1 className="text-2xl font-extrabold text-brand-ink">
        {proposal.fields["Client Name"]}
        {proposal.fields.Company ? ` · ${proposal.fields.Company}` : ""}
      </h1>
    </header>
  );

  const offerContent = offer && (offer.fields.Tagline || offer.fields.Description) && (
    <section className="mb-8 rounded-2xl border border-brand-ink/10 bg-white p-6">
      <h2 className="text-xl font-extrabold text-brand-ink">{offer.fields["Offer Name"]}</h2>
      {offer.fields.Tagline && (
        <p className="mt-1 font-medium text-brand-pink">{offer.fields.Tagline}</p>
      )}
      {offer.fields.Description && (
        <p className="mt-4 whitespace-pre-wrap text-sm text-brand-ink/80">
          {offer.fields.Description}
        </p>
      )}
    </section>
  );

  const fixedList = fixedItems.length > 0 && (
    <ul className="mb-6 divide-y divide-brand-ink/10 rounded-2xl border border-brand-ink/10 bg-white">
      {fixedItems.map((item) => (
        <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <span>{item.fields.Description}</span>
          <span className="font-extrabold">
            {currency.format(item.fields["Line Total"] ?? 0)}
          </span>
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
          description: o.fields.Description ?? "",
          lineTotal: o.fields["Line Total"] ?? 0,
        }))}
        addons={addons.map((a) => ({
          id: a.id,
          description: a.fields.Description ?? "",
          lineTotal: a.fields["Line Total"] ?? 0,
        }))}
        paymentPlans={availablePlans}
      />
    </main>
  );
}
