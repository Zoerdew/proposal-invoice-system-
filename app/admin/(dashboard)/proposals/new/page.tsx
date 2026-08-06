import { listOffers } from "@/lib/db/offers";
import ProposalForm from "../ProposalForm";

export const dynamic = "force-dynamic";

export default async function NewProposalPage() {
  const offers = await listOffers();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New proposal</h1>
      <ProposalForm
        mode="create"
        offers={offers.map((o) => ({ id: o.id, name: o.name || "Untitled" }))}
      />
    </div>
  );
}
