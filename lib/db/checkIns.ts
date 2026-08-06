import { db } from "./client";

export type FeltLike = "Ahead" | "On track" | "Behind";

export interface Checkin {
  id: string;
  clientId: string;
  weekDate: string;
  revenueThisWeek: number;
  qualitativeNotes: string;
  feltLike?: FeltLike;
  yourResponse: string;
  responded: boolean;
}

export interface CheckinInput {
  revenueThisWeek: number;
  qualitativeNotes: string;
  feltLike: FeltLike;
}

export async function getCheckinsByClientId(clientId: string): Promise<Checkin[]> {
  const { data, error } = await db()
    .from("check_ins")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true });
  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    clientId,
    weekDate: row.date,
    revenueThisWeek: row.revenue_this_week ?? 0,
    qualitativeNotes: row.qualitative_notes ?? "",
    feltLike: (row.felt_like as FeltLike) ?? undefined,
    yourResponse: row.your_response ?? "",
    responded: row.responded,
  }));
}

export async function createCheckin(clientId: string, input: CheckinInput): Promise<Checkin> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await db()
    .from("check_ins")
    .insert({
      client_id: clientId,
      date: today,
      revenue_this_week: input.revenueThisWeek,
      qualitative_notes: input.qualitativeNotes,
      felt_like: input.feltLike,
      responded: false,
    })
    .select()
    .single();
  if (error) throw error;

  return {
    id: data.id,
    clientId,
    weekDate: today,
    revenueThisWeek: input.revenueThisWeek,
    qualitativeNotes: input.qualitativeNotes,
    feltLike: input.feltLike,
    yourResponse: "",
    responded: false,
  };
}
