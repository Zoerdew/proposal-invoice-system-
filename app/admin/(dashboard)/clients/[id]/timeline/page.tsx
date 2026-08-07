import { getTimelineEvents } from "@/lib/db/timelineEvents";
import ClientTabs from "../ClientTabs";
import TimelineTable from "./TimelineTable";

export const dynamic = "force-dynamic";

export default async function ClientTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const events = await getTimelineEvents(id);

  return (
    <div>
      <h1 className="mb-2 text-xl font-semibold">Timeline</h1>
      <ClientTabs clientId={id} />
      <TimelineTable
        clientId={id}
        initialRows={events.map((e) => ({ key: e.id, month: e.month ?? "", whatHappened: e.whatHappened }))}
      />
    </div>
  );
}
