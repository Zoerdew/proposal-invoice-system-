import { db } from "./client";

export interface Decision {
  id: string;
  clientId: string;
  decision: string;
  promptedByNumber: string;
  expected: string;
  outcome: string;
  decidedAt: string | null;
}

export interface DecisionInput {
  decision: string;
  promptedByNumber?: string | null;
  expected?: string | null;
  outcome?: string | null;
  decidedAt?: string | null;
}

function toDecision(row: {
  id: string;
  client_id: string;
  decision: string;
  prompted_by_number: string | null;
  expected: string | null;
  outcome: string | null;
  decided_at: string | null;
}): Decision {
  return {
    id: row.id,
    clientId: row.client_id,
    decision: row.decision,
    promptedByNumber: row.prompted_by_number ?? "",
    expected: row.expected ?? "",
    outcome: row.outcome ?? "",
    decidedAt: row.decided_at,
  };
}

export async function getDecisions(clientId: string): Promise<Decision[]> {
  const { data, error } = await db()
    .from("decisions")
    .select("*")
    .eq("client_id", clientId)
    .order("decided_at", { ascending: false });
  if (error) throw error;
  return data.map(toDecision);
}

export async function createDecision(clientId: string, input: DecisionInput): Promise<Decision> {
  const { data, error } = await db()
    .from("decisions")
    .insert({
      client_id: clientId,
      decision: input.decision,
      prompted_by_number: input.promptedByNumber ?? null,
      expected: input.expected ?? null,
      outcome: input.outcome ?? null,
      decided_at: input.decidedAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toDecision(data);
}

export async function updateDecision(id: string, input: DecisionInput): Promise<Decision> {
  const { data, error } = await db()
    .from("decisions")
    .update({
      decision: input.decision,
      prompted_by_number: input.promptedByNumber ?? null,
      expected: input.expected ?? null,
      outcome: input.outcome ?? null,
      decided_at: input.decidedAt ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toDecision(data);
}

export async function deleteDecision(id: string): Promise<void> {
  const { error } = await db().from("decisions").delete().eq("id", id);
  if (error) throw error;
}

export async function replaceDecisions(clientId: string, items: DecisionInput[]): Promise<void> {
  const { error: deleteError } = await db().from("decisions").delete().eq("client_id", clientId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("decisions")
    .insert(
      items.map((item) => ({
        client_id: clientId,
        decision: item.decision,
        prompted_by_number: item.promptedByNumber ?? null,
        expected: item.expected ?? null,
        outcome: item.outcome ?? null,
        decided_at: item.decidedAt ?? null,
      }))
    );
  if (insertError) throw insertError;
}
