"use client";

import { useState } from "react";
import { Todo } from "@/lib/db/todos";

export default function TodoList({ token, initialTodos }: { token: string; initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos);

  async function toggle(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    const res = await fetch(`/api/portal/${token}/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) {
      // Revert on failure — the portal has no toast system, so this just
      // snaps the checkbox back rather than silently drifting from the DB.
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    }
  }

  if (todos.length === 0) {
    return (
      <div className="card-brutal py-16 text-center px-8">
        <p className="text-sm text-[#0a0608]/60">
          Nothing here yet — to-dos show up after a call together.
        </p>
      </div>
    );
  }

  return (
    <div className="card-brutal max-w-md p-8">
      <ul className="space-y-4">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={(e) => toggle(todo.id, e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#F11787]"
            />
            <span className={todo.done ? "text-sm line-through text-[#0a0608]/40" : "text-sm"}>
              {todo.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
