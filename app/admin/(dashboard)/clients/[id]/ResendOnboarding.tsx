"use client";

import { useState } from "react";

export default function ResendOnboarding({ clientId, portalToken }: { clientId: string; portalToken: string }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<"idle" | "sent" | "error">("idle");

  async function handleClick() {
    setSending(true);
    setResult("idle");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/resend-onboarding`, { method: "POST" });
      setResult(res.ok ? "sent" : "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold">Portal</h2>
      <p className="mb-4 break-all rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
        /c/{portalToken}/onboarding
      </p>
      {result === "sent" && <p className="mb-4 text-sm text-green-700">Sent.</p>}
      {result === "error" && <p className="mb-4 text-sm text-red-600">Failed to send — try again.</p>}
      <button
        onClick={handleClick}
        disabled={sending}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {sending ? "Sending…" : "Resend onboarding email"}
      </button>
    </div>
  );
}
