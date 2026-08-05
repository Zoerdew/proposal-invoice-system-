import { notFound } from "next/navigation";
import {
  ProposalFields,
  getLineItemsForProposal,
  getRecord,
  listOffers,
  TABLES,
} from "@/lib/airtable";
import ProposalForm from "../ProposalForm";

export const dynamic = "force-dynamic";

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let proposal;
  try {
    proposal = await getRecord<ProposalFields>(TABLES.proposals, id);
  } catch {
    notFound();
  }

  const [lineItems, offers] = await Promise.all([
    getLineItemsForProposal(proposal),
    listOffers(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit proposal</h1>
      <ProposalForm
        mode="edit"
        proposalId={id}
        offers={offers.map((o) => ({ id: o.id, name: o.fields["Offer Name"] ?? "Untitled" }))}
        initial={{
          clientName: proposal.fields["Client Name"] ?? "",
          clientEmail: proposal.fields["Client Email"] ?? "",
          company: proposal.fields.Company ?? "",
          contractTerms: proposal.fields["Contract Terms"] ?? "",
          status: proposal.fields.Status ?? "Draft",
          proposalLink: proposal.fields["Proposal Link"] ?? null,
          offerId: proposal.fields.Offer?.[0] ?? null,
          depositAmount: proposal.fields["Deposit Amount"] ?? null,
          rows: lineItems.map((item) => ({
            key: item.id,
            description: item.fields.Description ?? "",
            kind: item.fields.Kind ?? "Fixed",
            quantity: item.fields.Quantity ?? 1,
            unitPrice: item.fields["Unit Price"] ?? 0,
          })),
        }}
      />
    </div>
  );
}
