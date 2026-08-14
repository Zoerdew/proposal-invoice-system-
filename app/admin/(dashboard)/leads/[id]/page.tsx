import { notFound } from "next/navigation";
import Link from "next/link";
import { getLead, listLeadAttachments } from "@/lib/db/leads";
import { listProducts } from "@/lib/db/products";
import { listCallProposalsForLead } from "@/lib/db/callProposals";
import LeadForm from "../LeadForm";
import LeadAttachments from "./LeadAttachments";
import ConvertToProposal from "./ConvertToProposal";
import CallProposalsCard from "./CallProposalsCard";
import DeleteLead from "./DeleteLead";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let lead;
  try {
    lead = await getLead(id);
  } catch {
    notFound();
  }

  const [products, attachments, callProposals] = await Promise.all([
    listProducts(),
    listLeadAttachments(id),
    listCallProposalsForLead(id),
  ]);

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">
        {`${lead.firstName} ${lead.lastName}`.trim() || "Unnamed lead"}
      </h1>
      {lead.applicationId && (
        <p className="mb-4 text-sm text-[#0a0608]/50">
          <Link href={`/admin/applications/${lead.applicationId}`} className="underline">
            Linked application
          </Link>
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <LeadForm
            mode="edit"
            leadId={id}
            products={products}
            initial={{
              firstName: lead.firstName,
              lastName: lead.lastName,
              email: lead.email,
              phone: lead.phone,
              source: lead.source,
              productId: lead.productId,
              leadStage: lead.leadStage,
              leadValue: lead.leadValue,
              conversionProbability: lead.conversionProbability,
              notes: lead.notes,
              firstContactDate: lead.firstContactDate,
              closeDate: lead.closeDate,
              daysUntilNextContact: lead.daysUntilNextContact,
              updatedAt: lead.updatedAt,
            }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <LeadAttachments leadId={id} attachments={attachments} />
          <ConvertToProposal leadId={id} />
          <CallProposalsCard leadId={id} callProposals={callProposals} />
          <DeleteLead leadId={id} />
        </div>
      </div>
    </div>
  );
}
