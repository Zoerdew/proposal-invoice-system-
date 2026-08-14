import { notFound } from "next/navigation";
import { getProposal } from "@/lib/db/proposals";
import { getLineItemsForProposal } from "@/lib/db/lineItems";
import { listOffers } from "@/lib/db/offers";
import { getClientByProposalId } from "@/lib/db/clients";
import ProposalForm from "../ProposalForm";
import ClientProvisioning from "./ClientProvisioning";
import DeleteProposal from "./DeleteProposal";

export const dynamic = "force-dynamic";

const SIGNED_STATUSES = ["Signed", "Invoiced", "Paid"];

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let proposal;
  try {
    proposal = await getProposal(id);
  } catch {
    notFound();
  }

  const [lineItems, offers, client] = await Promise.all([
    getLineItemsForProposal(id),
    listOffers(),
    getClientByProposalId(id),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">Edit proposal</h1>
      <ProposalForm
        mode="edit"
        proposalId={id}
        offers={offers.map((o) => ({ id: o.id, name: o.name || "Untitled" }))}
        initial={{
          clientName: proposal.clientName,
          clientEmail: proposal.clientEmail,
          company: proposal.company,
          contractTerms: proposal.contractTerms,
          status: proposal.status,
          proposalLink: proposal.proposalLink,
          offerId: proposal.offerId,
          depositAmount: proposal.depositAmount,
          rows: lineItems.map((item) => ({
            key: item.id,
            description: item.description,
            kind: item.kind,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }}
      />
      {SIGNED_STATUSES.includes(proposal.status) && (
        <div className="mt-6">
          <ClientProvisioning proposalId={id} existingPortalToken={client?.portalToken ?? null} />
        </div>
      )}
      {!SIGNED_STATUSES.includes(proposal.status) && <DeleteProposal proposalId={id} />}
    </div>
  );
}
