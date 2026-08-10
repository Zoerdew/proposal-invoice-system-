"use client";

import { useState } from "react";
import { Todo } from "@/lib/db/todos";

export default function RecapTodoList({ slug, initialTodos }: { slug: string; initialTodos: Todo[] }) {
  const [todos, setTodos] = useState(initialTodos);

  async function toggle(id: string, done: boolean) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done } : t)));
    const res = await fetch(`/api/recap/${slug}/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    if (!res.ok) {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
    }
  }

  if (todos.length === 0) return null;

  return (
    <div className="card-brutal p-8">
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
