"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Reading {
  id: string;
  value: number | null;
  readAt: string;
}

export default function MetricReadings({
  clientId,
  metricId,
  metricName,
  readings,
}: {
  clientId: string;
  metricId: string;
  metricName: string;
  readings: Reading[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/clients/${clientId}/metrics/${metricId}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: Number(value) }),
      });
      setValue("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card p-4">
      <h3 className="mb-2 font-heading font-[800] text-sm">{metricName} — readings</h3>
      {readings.length === 0 ? (
        <p className="mb-2 text-xs text-[#0a0608]/50">No readings yet.</p>
      ) : (
        <ul className="mb-2 text-xs text-[#0a0608]/60">
          {readings.map((r) => (
            <li key={r.id}>
              {new Date(r.readAt).toLocaleDateString("en-GB")} — {r.value}
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="New reading"
          className="admin-input w-32 px-2 py-1 text-sm"
        />
        <button onClick={handleAdd} disabled={saving} className="admin-btn-secondary px-3 py-1 text-sm">
          Add
        </button>
      </div>
    </div>
  );
}
