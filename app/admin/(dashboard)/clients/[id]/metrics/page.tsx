import { getMetrics, getMetricReadings } from "@/lib/db/metrics";
import ClientTabs from "../ClientTabs";
import MetricsTable from "./MetricsTable";
import MetricReadings from "./MetricReadings";

export const dynamic = "force-dynamic";

export default async function ClientMetricsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const metrics = await getMetrics(id);
  const readingsByMetric = await Promise.all(
    metrics.map(async (m) => ({ metric: m, readings: await getMetricReadings(m.id) }))
  );

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">Metrics</h1>
      <ClientTabs clientId={id} />
      <div className="mb-6">
        <MetricsTable
          clientId={id}
          initialRows={metrics.map((m) => ({
            key: m.id,
            id: m.id,
            name: m.name,
            definition: m.definition,
            baseline: m.baseline != null ? String(m.baseline) : "",
            target: m.target != null ? String(m.target) : "",
          }))}
        />
      </div>
      {readingsByMetric.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {readingsByMetric.map(({ metric, readings }) => (
            <MetricReadings
              key={metric.id}
              clientId={id}
              metricId={metric.id}
              metricName={metric.name}
              readings={readings}
            />
          ))}
        </div>
      )}
    </div>
  );
}
