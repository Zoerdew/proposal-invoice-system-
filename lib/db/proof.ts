import { db } from "./client";

export type ProofType = "Testimonial" | "Thank You" | "Unprompted Praise";

export interface Proof {
  id: string;
  clientId: string;
  dateAdded: string | null;
  type: ProofType;
  text: string;
  source: string;
  screenshotUrl?: string;
}

export interface ProofInput {
  type: ProofType;
  text: string;
  source: string;
  screenshotUrl?: string;
}

export async function getProofByClientId(clientId: string): Promise<Proof[]> {
  const { data, error } = await db()
    .from("proof")
    .select("*")
    .eq("client_id", clientId)
    .order("date_added", { ascending: false });
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    clientId,
    dateAdded: row.date_added,
    type: (row.type as ProofType) ?? "Testimonial",
    text: row.text,
    source: row.source ?? "",
    screenshotUrl: row.screenshot_url ?? undefined,
  }));
}

export async function createProof(clientId: string, input: ProofInput): Promise<Proof> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db()
    .from("proof")
    .insert({
      client_id: clientId,
      date_added: today,
      type: input.type,
      text: input.text,
      source: input.source,
      screenshot_url: input.screenshotUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    clientId,
    dateAdded: today,
    type: input.type,
    text: input.text,
    source: input.source,
    screenshotUrl: input.screenshotUrl,
  };
}
