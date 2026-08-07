import { db } from "./client";

export interface TimelineEvent {
  id: string;
  clientId: string;
  month: string | null;
  whatHappened: string;
}

export interface TimelineEventInput {
  month: string;
  whatHappened: string;
}

function toTimelineEvent(row: {
  id: string;
  client_id: string;
  month: string;
  what_happened: string | null;
}): TimelineEvent {
  return {
    id: row.id,
    clientId: row.client_id,
    month: row.month,
    whatHappened: row.what_happened ?? "",
  };
}

export async function getTimelineEvents(clientId: string): Promise<TimelineEvent[]> {
  const { data, error } = await db()
    .from("timeline_events")
    .select("*")
    .eq("client_id", clientId)
    .order("month");
  if (error) throw error;
  return data.map(toTimelineEvent);
}

export async function createTimelineEvent(
  clientId: string,
  input: TimelineEventInput
): Promise<TimelineEvent> {
  const { data, error } = await db()
    .from("timeline_events")
    .insert({ client_id: clientId, month: input.month, what_happened: input.whatHappened })
    .select()
    .single();
  if (error) throw error;
  return toTimelineEvent(data);
}

export async function updateTimelineEvent(id: string, input: TimelineEventInput): Promise<TimelineEvent> {
  const { data, error } = await db()
    .from("timeline_events")
    .update({ month: input.month, what_happened: input.whatHappened })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toTimelineEvent(data);
}

export async function deleteTimelineEvent(id: string): Promise<void> {
  const { error } = await db().from("timeline_events").delete().eq("id", id);
  if (error) throw error;
}

export async function replaceTimelineEvents(clientId: string, items: TimelineEventInput[]): Promise<void> {
  const { error: deleteError } = await db().from("timeline_events").delete().eq("client_id", clientId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("timeline_events")
    .insert(items.map((item) => ({ client_id: clientId, month: item.month, what_happened: item.whatHappened })));
  if (insertError) throw insertError;
}
