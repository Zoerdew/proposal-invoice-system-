"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MatchToClientForm({
  meetingNoteId,
  clients,
}: {
  meetingNoteId: string;
  clients: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleMatch() {
    if (!clientId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/meeting-notes/${meetingNoteId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="admin-input px-2 py-1 text-sm"
      >
        <option value="">— choose a client —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleMatch}
        disabled={!clientId || saving}
        className="admin-btn-secondary text-xs px-3 py-1.5"
      >
        {saving ? "Matching…" : "Match"}
      </button>
    </div>
  );
}
