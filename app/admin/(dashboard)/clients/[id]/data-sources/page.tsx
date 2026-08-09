import { getDataSources } from "@/lib/db/dataSources";
import ClientTabs from "../ClientTabs";
import DataSourcesTable from "./DataSourcesTable";

export const dynamic = "force-dynamic";

export default async function ClientDataSourcesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sources = await getDataSources(id);

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">Data sources</h1>
      <ClientTabs clientId={id} />
      <DataSourcesTable
        clientId={id}
        initialRows={sources.map((s) => ({
          key: s.id,
          kind: s.kind,
          periodCovered: s.periodCovered,
          receivedAt: s.receivedAt ? s.receivedAt.slice(0, 10) : "",
          fileUrl: s.fileUrl,
        }))}
      />
    </div>
  );
}
