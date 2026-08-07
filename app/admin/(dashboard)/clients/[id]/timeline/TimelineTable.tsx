"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Row {
  key: string;
  month: string;
  whatHappened: string;
}

function emptyRow(): Row {
  return { key: crypto.randomUUID(), month: "", whatHappened: "" };
}

export default function TimelineTable({ clientId, initialRows }: { clientId: string; initialRows: Row[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(initialRows.length > 0 ? initialRows : [emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/timeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: rows
            .filter((r) => r.month && r.whatHappened.trim())
            .map((r) => ({ month: r.month, whatHappened: r.whatHappened })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <table className="w-full text-sm">
        <thead className="text-left text-gray-500">
          <tr>
            <th className="w-40 py-1 font-medium">Month</th>
            <th className="py-1 font-medium">What happened</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <td className="py-2 pr-2">
                <input
                  type="month"
                  value={row.month ? row.month.slice(0, 7) : ""}
                  onChange={(e) => updateRow(row.key, { month: e.target.value ? `${e.target.value}-01` : "" })}
                  className="rounded-md border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="py-2 pr-2">
                <input
                  value={row.whatHappened}
                  onChange={(e) => updateRow(row.key, { whatHappened: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-2 py-1"
                  placeholder="e.g. Launched, ads on, price change, holiday..."
                />
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="Remove row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={() => setRows((current) => [...current, emptyRow()])}
        className="mt-3 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        + Add month
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
