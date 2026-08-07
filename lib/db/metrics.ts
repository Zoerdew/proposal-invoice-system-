import { db } from "./client";

export interface Metric {
  id: string;
  clientId: string;
  name: string;
  definition: string;
  baseline: number | null;
  target: number | null;
}

export interface MetricInput {
  name: string;
  definition?: string | null;
  baseline?: number | null;
  target?: number | null;
}

export interface MetricReading {
  id: string;
  metricId: string;
  value: number | null;
  readAt: string;
}

function toMetric(row: {
  id: string;
  client_id: string;
  name: string;
  definition: string | null;
  baseline: number | null;
  target: number | null;
}): Metric {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    definition: row.definition ?? "",
    baseline: row.baseline,
    target: row.target,
  };
}

function toMetricReading(row: { id: string; metric_id: string; value: number | null; read_at: string }): MetricReading {
  return { id: row.id, metricId: row.metric_id, value: row.value, readAt: row.read_at };
}

export async function getMetrics(clientId: string): Promise<Metric[]> {
  const { data, error } = await db()
    .from("metrics")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw error;
  return data.map(toMetric);
}

export async function createMetric(clientId: string, input: MetricInput): Promise<Metric> {
  const { data, error } = await db()
    .from("metrics")
    .insert({
      client_id: clientId,
      name: input.name,
      definition: input.definition ?? null,
      baseline: input.baseline ?? null,
      target: input.target ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toMetric(data);
}

export async function updateMetric(id: string, input: MetricInput): Promise<Metric> {
  const { data, error } = await db()
    .from("metrics")
    .update({
      name: input.name,
      definition: input.definition ?? null,
      baseline: input.baseline ?? null,
      target: input.target ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toMetric(data);
}

export async function deleteMetric(id: string): Promise<void> {
  const { error } = await db().from("metrics").delete().eq("id", id);
  if (error) throw error;
}

// Deleting a metric cascades to its readings (FK on_delete cascade), so
// replacing the metric list is safe even though readings aren't
// re-submitted here — a metric that survives the replace keeps its id and
// its readings; one that's removed takes its readings with it.
export async function replaceMetrics(
  clientId: string,
  items: (MetricInput & { id?: string })[]
): Promise<void> {
  const existing = await getMetrics(clientId);
  const keepIds = new Set(items.filter((i) => i.id).map((i) => i.id));
  const toDelete = existing.filter((m) => !keepIds.has(m.id));

  for (const m of toDelete) {
    const { error } = await db().from("metrics").delete().eq("id", m.id);
    if (error) throw error;
  }

  for (const item of items) {
    if (item.id) {
      const { error } = await db()
        .from("metrics")
        .update({
          name: item.name,
          definition: item.definition ?? null,
          baseline: item.baseline ?? null,
          target: item.target ?? null,
        })
        .eq("id", item.id);
      if (error) throw error;
    } else {
      const { error } = await db()
        .from("metrics")
        .insert({
          client_id: clientId,
          name: item.name,
          definition: item.definition ?? null,
          baseline: item.baseline ?? null,
          target: item.target ?? null,
        });
      if (error) throw error;
    }
  }
}

export async function getMetricReadings(metricId: string): Promise<MetricReading[]> {
  const { data, error } = await db()
    .from("metric_readings")
    .select("*")
    .eq("metric_id", metricId)
    .order("read_at");
  if (error) throw error;
  return data.map(toMetricReading);
}

export async function createMetricReading(metricId: string, value: number, readAt?: string): Promise<MetricReading> {
  const { data, error } = await db()
    .from("metric_readings")
    .insert({ metric_id: metricId, value, read_at: readAt ?? new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return toMetricReading(data);
}

export async function deleteMetricReading(id: string): Promise<void> {
  const { error } = await db().from("metric_readings").delete().eq("id", id);
  if (error) throw error;
}
