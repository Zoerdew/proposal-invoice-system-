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

  const doneCount = todos.filter((t) => t.done).length;
  const progressPct = Math.round((doneCount / todos.length) * 100);

  return (
    <div>
      <div className="bg-cream rounded-[20px] border-2 border-[#0a0608] p-6 mb-6">
        <div className="flex justify-between text-xs uppercase tracking-wide text-[#0a0608]/50 mb-3">
          <span>Progress</span>
          <span className="font-heading font-[800] text-[#0a0608]">
            {doneCount} of {todos.length} done
          </span>
        </div>
        <div className="h-2.5 w-full bg-[#0a0608]/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#F11787] transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
      <ul className="space-y-3">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-start gap-3 bg-cream rounded-2xl border-2 border-[#0a0608] p-5"
          >
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
