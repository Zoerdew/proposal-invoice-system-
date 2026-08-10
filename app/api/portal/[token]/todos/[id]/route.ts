import { NextRequest, NextResponse } from "next/server";
import { getClientByToken } from "@/lib/db/clients";
import { listTodosForClient, toggleTodo } from "@/lib/db/todos";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id } = await params;
  const client = await getClientByToken(token);
  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // The token scopes portal access today (Phase 14's login layers on top
  // of this later) — confirm the todo actually belongs to this client
  // before letting the token holder toggle it, same spirit as the
  // onboarding-complete check on the check-in route.
  const ownTodos = await listTodosForClient(client.id);
  if (!ownTodos.some((t) => t.id === id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.done !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const todo = await toggleTodo(id, body.done);
  return NextResponse.json(todo);
}
