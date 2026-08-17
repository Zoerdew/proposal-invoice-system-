"use client";

import { useState } from "react";

export default function ExportClient({ clientId }: { clientId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "copied" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/export`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const data = await res.json();
      await navigator.clipboard.writeText(data.text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <button onClick={handleClick} disabled={status === "loading"} className="underline disabled:opacity-50">
      {status === "loading" ? "Copying…" : status === "copied" ? "Copied ✓" : "Copy everything"}
      {status === "error" && <span className="ml-2 text-red-600">Failed — try again</span>}
    </button>
  );
}
