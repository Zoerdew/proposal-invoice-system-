"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Wrong password.");
        return;
      }
      router.push("/admin/proposals");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <div className="admin-card p-8">
        <h1 className="mb-6 font-heading font-[800] text-xl">Admin login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="admin-input mb-4 w-full px-3 py-2.5"
            autoFocus
            required
          />
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="admin-btn w-full py-2.5">
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}
