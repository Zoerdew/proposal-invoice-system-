"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FINDING_STATUS_OPTIONS, FINDING_TYPE_OPTIONS } from "@/lib/db/clientChoices";

interface Row {
  key: string;
  title: string;
  type: string;
  description: string;
  value: string;
  status: string;
  dateFound: string;
  source: string;
}

function emptyRow(): Row {
  return {
    key: crypto.randomUUID(),
    title: "",
    type: "Opportunity",
    description: "",
    value: "",
    status: "Identified",
    dateFound: "",
    source: "",
  };
}

export default function FindingsTable({
  clientId,
  initialRows,
}: {
  clientId: string;
  initialRows: Row[];
}) {
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
      const res = await fetch(`/api/admin/clients/${clientId}/findings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: rows
            .filter((r) => r.title.trim())
            .map((r) => ({
              title: r.title,
              type: r.type,
              description: r.description || undefined,
              value: r.value.trim() ? Number(r.value) : undefined,
              status: r.status,
              dateFound: r.dateFound || undefined,
              source: r.source || undefined,
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
    <div className="admin-card p-6">
      <table className="w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="w-1/4 py-1 admin-label">Title</th>
            <th className="py-1 admin-label">Type</th>
            <th className="py-1 admin-label">Value</th>
            <th className="py-1 admin-label">Status</th>
            <th className="py-1 admin-label">Date found</th>
            <th className="py-1 admin-label">Source</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t-2 border-[#0a0608]/10 align-top">
              <td className="py-2 pr-2">
                <input
                  value={row.title}
                  onChange={(e) => updateRow(row.key, { title: e.target.value })}
                  className="w-full admin-input px-2 py-1"
                  placeholder="Finding title"
                />
                <textarea
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                  className="mt-1 w-full admin-input px-2 py-1 text-xs"
                  placeholder="Description"
                  rows={2}
                />
              </td>
              <td className="py-2 pr-2">
                <select
                  value={row.type}
                  onChange={(e) => updateRow(row.key, { type: e.target.value })}
                  className="admin-input px-2 py-1"
                >
                  {FINDING_TYPE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2 pr-2">
                <input
                  type="number"
                  step="0.01"
                  value={row.value}
                  onChange={(e) => updateRow(row.key, { value: e.target.value })}
                  className="w-24 admin-input px-2 py-1"
                />
              </td>
              <td className="py-2 pr-2">
                <select
                  value={row.status}
                  onChange={(e) => updateRow(row.key, { status: e.target.value })}
                  className="admin-input px-2 py-1"
                >
                  {FINDING_STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2 pr-2">
                <input
                  type="date"
                  value={row.dateFound}
                  onChange={(e) => updateRow(row.key, { dateFound: e.target.value })}
                  className="admin-input px-2 py-1"
                />
              </td>
              <td className="py-2 pr-2">
                <input
                  value={row.source}
                  onChange={(e) => updateRow(row.key, { source: e.target.value })}
                  className="w-24 admin-input px-2 py-1"
                />
              </td>
              <td className="py-2">
                <button
                  type="button"
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                  className="text-[#0a0608]/30 hover:text-red-600"
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
        className="admin-btn-secondary text-xs px-3 py-1.5 mt-3"
      >
        + Add finding
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <button onClick={handleSave} disabled={saving} className="admin-btn px-4 py-2 text-sm">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
