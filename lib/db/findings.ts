import { db } from "./client";
import { findingTypeFromDb, FindingType } from "./shared";

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

export async function getFindingsByClientId(clientId: string): Promise<Finding[]> {
  const { data, error } = await db()
    .from("findings")
    .select("*")
    .eq("client_id", clientId)
    .order("date_found", { ascending: false });
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    clientId,
    type: findingTypeFromDb(row.type ?? "opportunity"),
    title: row.title,
    description: row.description ?? "",
    value: row.value ?? 0,
    status: (row.status as FindingStatus) ?? "Identified",
    dateFound: row.date_found,
    source: row.source ?? "",
  }));
}
