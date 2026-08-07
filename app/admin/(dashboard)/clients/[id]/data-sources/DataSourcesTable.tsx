"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Row {
  key: string;
  kind: string;
  periodCovered: string;
  receivedAt: string;
  fileUrl: string;
}

function emptyRow(): Row {
  return { key: crypto.randomUUID(), kind: "", periodCovered: "", receivedAt: "", fileUrl: "" };
}

export default function DataSourcesTable({ clientId, initialRows }: { clientId: string; initialRows: Row[] }) {
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
      const res = await fetch(`/api/admin/clients/${clientId}/data-sources`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: rows
            .filter((r) => r.kind.trim())
            .map((r) => ({
              kind: r.kind,
              periodCovered: r.periodCovered || undefined,
              receivedAt: r.receivedAt || undefined,
              fileUrl: r.fileUrl || undefined,
            })),
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
            <th className="py-1 font-medium">Kind</th>
            <th className="py-1 font-medium">Period covered</th>
            <th className="py-1 font-medium">Received</th>
            <th className="py-1 font-medium">File URL</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <td className="py-2 pr-2">
                <input
                  value={row.kind}
                  onChange={(e) => updateRow(row.key, { kind: e.target.value })}
                  className="w-32 rounded-md border border-gray-300 px-2 py-1"
                  placeholder="e.g. Stripe export"
                />
              </td>
              <td className="py-2 pr-2">
                <input
                  value={row.periodCovered}
                  onChange={(e) => updateRow(row.key, { periodCovered: e.target.value })}
                  className="w-32 rounded-md border border-gray-300 px-2 py-1"
                  placeholder="e.g. Jan-Jun 2026"
                />
              </td>
              <td className="py-2 pr-2">
                <input
                  type="date"
                  value={row.receivedAt}
                  onChange={(e) => updateRow(row.key, { receivedAt: e.target.value })}
                  className="rounded-md border border-gray-300 px-2 py-1"
                />
              </td>
              <td className="py-2 pr-2">
                <input
                  value={row.fileUrl}
                  onChange={(e) => updateRow(row.key, { fileUrl: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-2 py-1"
                  placeholder="https://..."
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
        + Add data source
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
