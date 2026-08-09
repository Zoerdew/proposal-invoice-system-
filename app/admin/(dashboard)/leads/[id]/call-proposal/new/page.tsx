import { notFound } from "next/navigation";
import { getLead } from "@/lib/db/leads";
import CallProposalGenerator from "./CallProposalGenerator";

export const dynamic = "force-dynamic";

export default async function NewCallProposalPage({
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

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">
        New call proposal — {`${lead.firstName} ${lead.lastName}`.trim() || "Unnamed lead"}
      </h1>
      <CallProposalGenerator leadId={id} />
    </div>
  );
}
