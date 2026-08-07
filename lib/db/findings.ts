import { db } from "./client";
import { findingTypeFromDb, findingTypeToDb, FindingType } from "./shared";

export type FindingStatus = "Identified" | "In Progress" | "Fixed" | "Banked";

export interface Finding {
  id: string;
  clientId: string;
  type: FindingType;
  title: string;
  description: string;
  value: number;
  status: FindingStatus;
  dateFound: string | null;
  source: string;
}

function toFinding(row: {
  id: string;
  client_id: string;
  type: string | null;
  title: string;
  description: string | null;
  value: number | null;
  status: string | null;
  date_found: string | null;
  source: string | null;
}): Finding {
  return {
    id: row.id,
    clientId: row.client_id,
    type: findingTypeFromDb(row.type ?? "opportunity"),
    title: row.title,
    description: row.description ?? "",
    value: row.value ?? 0,
    status: (row.status as FindingStatus) ?? "Identified",
    dateFound: row.date_found,
    source: row.source ?? "",
  };
}

export async function getFindingsByClientId(clientId: string): Promise<Finding[]> {
  const { data, error } = await db()
    .from("findings")
    .select("*")
    .eq("client_id", clientId)
    .order("date_found", { ascending: false });
  if (error) throw error;
  return data.map(toFinding);
}

export interface FindingInput {
  title: string;
  type: FindingType;
  description?: string | null;
  value?: number | null;
  status?: FindingStatus;
  dateFound?: string | null;
  source?: string | null;
}

export async function createFinding(clientId: string, input: FindingInput): Promise<Finding> {
  const { data, error } = await db()
    .from("findings")
    .insert({
      client_id: clientId,
      title: input.title,
      type: findingTypeToDb(input.type),
      description: input.description ?? null,
      value: input.value ?? null,
      status: input.status ?? "Identified",
      date_found: input.dateFound ?? null,
      source: input.source ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toFinding(data);
}

export async function updateFinding(id: string, input: FindingInput): Promise<Finding> {
  const { data, error } = await db()
    .from("findings")
    .update({
      title: input.title,
      type: findingTypeToDb(input.type),
      description: input.description ?? null,
      value: input.value ?? null,
      status: input.status ?? "Identified",
      date_found: input.dateFound ?? null,
      source: input.source ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toFinding(data);
}

export async function deleteFinding(id: string): Promise<void> {
  const { error } = await db().from("findings").delete().eq("id", id);
  if (error) throw error;
}

// Admin edits the whole list at once (matches the line-items pattern used
// elsewhere) rather than per-row API calls.
export async function replaceFindings(clientId: string, items: FindingInput[]): Promise<void> {
  const { error: deleteError } = await db().from("findings").delete().eq("client_id", clientId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("findings")
    .insert(
      items.map((item) => ({
        client_id: clientId,
        title: item.title,
        type: findingTypeToDb(item.type),
        description: item.description ?? null,
        value: item.value ?? null,
        status: item.status ?? "Identified",
        date_found: item.dateFound ?? null,
        source: item.source ?? null,
      }))
    );
  if (insertError) throw insertError;
}
