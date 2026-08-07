import { getDecisions } from "@/lib/db/decisions";
import ClientTabs from "../ClientTabs";
import DecisionsTable from "./DecisionsTable";

export const dynamic = "force-dynamic";

export default async function ClientDecisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decisions = await getDecisions(id);

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Decisions</h1>
      <ClientTabs clientId={id} />
      <DecisionsTable
        clientId={id}
        initialRows={decisions.map((d) => ({
          key: d.id,
          decision: d.decision,
          promptedByNumber: d.promptedByNumber,
          expected: d.expected,
          outcome: d.outcome,
          decidedAt: d.decidedAt ? d.decidedAt.slice(0, 10) : "",
        }))}
      />
    </div>
  );
}
