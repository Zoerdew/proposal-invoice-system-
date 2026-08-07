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
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold">{metricName} — readings</h3>
      {readings.length === 0 ? (
        <p className="mb-2 text-xs text-gray-500">No readings yet.</p>
      ) : (
        <ul className="mb-2 text-xs text-gray-600">
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
          className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={saving}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}
