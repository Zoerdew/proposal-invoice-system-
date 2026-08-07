import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import { getMetrics, getMetricReadings, type Metric, type MetricReading } from "@/lib/db/metrics";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function ScorecardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const metrics = await getMetrics(client.id);
  const readingsByMetric = new Map<string, MetricReading[]>(
    await Promise.all(
      metrics.map(
        async (m): Promise<[string, MetricReading[]]> => [m.id, await getMetricReadings(m.id)]
      )
    )
  );

  return (
    <div>
      <p className="text-sm tracking-wide uppercase text-[#0a0608]/50 mb-10">
        Commercial Scorecard
      </p>

      {metrics.length === 0 && (
        <p className="text-sm text-[#0a0608]/50">No metrics set up yet.</p>
      )}

      <ul>
        {metrics.map((metric: Metric) => {
          const readings = readingsByMetric.get(metric.id) ?? [];
          const latest = readings[readings.length - 1];
          return (
            <li key={metric.id} className="py-8 border-t border-[#0a0608]/10">
              <div className="flex justify-between items-baseline mb-1 gap-4">
                <h2 className="font-heading font-[800] text-xl">{metric.name}</h2>
                {latest && (
                  <p className="font-heading font-[800] text-2xl shrink-0">
                    {formatNumber(latest.value ?? 0)}
                  </p>
                )}
              </div>
              {metric.definition && (
                <p className="text-sm text-[#0a0608]/60 mb-3">{metric.definition}</p>
              )}
              <div className="flex gap-6 text-sm text-[#0a0608]/60 mb-4">
                {metric.baseline !== null && <span>Baseline: {formatNumber(metric.baseline)}</span>}
                {metric.target !== null && <span>Target: {formatNumber(metric.target)}</span>}
              </div>
              {readings.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {readings.map((r) => (
                    <li key={r.id} className="text-xs text-[#0a0608]/40">
                      {formatDate(r.readAt)}: {formatNumber(r.value ?? 0)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
