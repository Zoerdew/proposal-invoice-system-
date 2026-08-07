import { db } from "./client";

export interface DataSource {
  id: string;
  clientId: string;
  kind: string;
  periodCovered: string;
  receivedAt: string | null;
  fileUrl: string;
}

export interface DataSourceInput {
  kind: string;
  periodCovered?: string | null;
  receivedAt?: string | null;
  fileUrl?: string | null;
}

function toDataSource(row: {
  id: string;
  client_id: string;
  kind: string | null;
  period_covered: string | null;
  received_at: string | null;
  file_url: string | null;
}): DataSource {
  return {
    id: row.id,
    clientId: row.client_id,
    kind: row.kind ?? "",
    periodCovered: row.period_covered ?? "",
    receivedAt: row.received_at,
    fileUrl: row.file_url ?? "",
  };
}

export async function getDataSources(clientId: string): Promise<DataSource[]> {
  const { data, error } = await db()
    .from("data_sources")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw error;
  return data.map(toDataSource);
}

export async function createDataSource(clientId: string, input: DataSourceInput): Promise<DataSource> {
  const { data, error } = await db()
    .from("data_sources")
    .insert({
      client_id: clientId,
      kind: input.kind,
      period_covered: input.periodCovered ?? null,
      received_at: input.receivedAt ?? null,
      file_url: input.fileUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toDataSource(data);
}

export async function updateDataSource(id: string, input: DataSourceInput): Promise<DataSource> {
  const { data, error } = await db()
    .from("data_sources")
    .update({
      kind: input.kind,
      period_covered: input.periodCovered ?? null,
      received_at: input.receivedAt ?? null,
      file_url: input.fileUrl ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toDataSource(data);
}

export async function deleteDataSource(id: string): Promise<void> {
  const { error } = await db().from("data_sources").delete().eq("id", id);
  if (error) throw error;
}

export async function replaceDataSources(clientId: string, items: DataSourceInput[]): Promise<void> {
  const { error: deleteError } = await db().from("data_sources").delete().eq("client_id", clientId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("data_sources")
    .insert(
      items.map((item) => ({
        client_id: clientId,
        kind: item.kind,
        period_covered: item.periodCovered ?? null,
        received_at: item.receivedAt ?? null,
        file_url: item.fileUrl ?? null,
      }))
    );
  if (insertError) throw insertError;
}
