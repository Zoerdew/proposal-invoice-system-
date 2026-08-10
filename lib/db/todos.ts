import { db } from "./client";

export interface Todo {
  id: string;
  meetingNoteId: string;
  text: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

type TodoRow = {
  id: string;
  meeting_note_id: string;
  text: string;
  done: boolean;
  created_at: string;
  updated_at: string;
};

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    meetingNoteId: row.meeting_note_id,
    text: row.text,
    done: row.done,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTodo(meetingNoteId: string, text: string): Promise<Todo> {
  const { data, error } = await db()
    .from("todos")
    .insert({ meeting_note_id: meetingNoteId, text })
    .select()
    .single();
  if (error) throw error;
  return toTodo(data);
}

// todos has no client_id of its own — reached through meeting_notes, so a
// client's to-dos come from a join rather than a direct column lookup.
export async function listTodosForClient(clientId: string): Promise<Todo[]> {
  const { data, error } = await db()
    .from("todos")
    .select("*, meeting_notes!inner(client_id)")
    .eq("meeting_notes.client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toTodo);
}

// Distinct from listTodosForClient — a recap page shows only this call's
// next-steps, not the client's whole history across every call.
export async function listTodosForMeetingNote(meetingNoteId: string): Promise<Todo[]> {
  const { data, error } = await db()
    .from("todos")
    .select("*")
    .eq("meeting_note_id", meetingNoteId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(toTodo);
}

export async function toggleTodo(id: string, done: boolean): Promise<Todo> {
  const { data, error } = await db()
    .from("todos")
    .update({ done })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toTodo(data);
}
