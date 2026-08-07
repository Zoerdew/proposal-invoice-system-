import { getFindingsByClientId } from "@/lib/db/findings";
import ClientTabs from "../ClientTabs";
import FindingsTable from "./FindingsTable";

export const dynamic = "force-dynamic";

export default async function ClientFindingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const findings = await getFindingsByClientId(id);

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Findings</h1>
      <ClientTabs clientId={id} />
      <FindingsTable
        clientId={id}
        initialRows={findings.map((f) => ({
          key: f.id,
          title: f.title,
          type: f.type,
          description: f.description,
          value: f.value ? String(f.value) : "",
          status: f.status,
          dateFound: f.dateFound ? f.dateFound.slice(0, 10) : "",
          source: f.source,
        }))}
      />
    </div>
  );
}
