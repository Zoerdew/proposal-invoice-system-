"use client";

export type RowKind = "Fixed" | "Package Option" | "Add-on";

export interface LineItemRow {
  key: string;
  description: string;
  kind: RowKind;
  quantity: number;
  unitPrice: number;
}

export function emptyRow(): LineItemRow {
  return {
    key: crypto.randomUUID(),
    description: "",
    kind: "Fixed",
    quantity: 1,
    unitPrice: 0,
  };
}

export default function LineItemRows({
  rows,
  onChange,
  disabled,
}: {
  rows: LineItemRow[];
  onChange: (rows: LineItemRow[]) => void;
  disabled?: boolean;
}) {
  function updateRow(key: string, patch: Partial<LineItemRow>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="text-left">
          <tr>
            <th className="w-1/2 py-1 admin-label">Description</th>
            <th className="py-1 admin-label">Kind</th>
            <th className="py-1 admin-label">Qty</th>
            <th className="py-1 admin-label">Unit price</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t-2 border-[#0a0608]/10">
              <td className="py-1.5 pr-2">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                  disabled={disabled}
                  className="admin-input w-full px-2 py-1"
                  placeholder="Line item description"
                />
              </td>
              <td className="py-1.5 pr-2">
                <select
                  value={row.kind}
                  onChange={(e) => updateRow(row.key, { kind: e.target.value as RowKind })}
                  disabled={disabled}
                  className="admin-input px-2 py-1"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Package Option">Package Option</option>
                  <option value="Add-on">Add-on</option>
                </select>
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.key, { quantity: Number(e.target.value) || 0 })
                  }
                  disabled={disabled}
                  className="admin-input w-16 px-2 py-1"
                  step="0.01"
                />
              </td>
              <td className="py-1.5 pr-2">
                <input
                  type="number"
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateRow(row.key, { unitPrice: Number(e.target.value) || 0 })
                  }
                  disabled={disabled}
                  className="admin-input w-24 px-2 py-1"
                  step="0.01"
                />
              </td>
              <td className="py-1.5">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                    className="text-[#0a0608]/30 hover:text-red-600"
                    aria-label="Remove row"
                  >
                    ✕
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled && (
        <button type="button" onClick={() => onChange([...rows, emptyRow()])} className="admin-btn-secondary text-xs px-3 py-1.5 mt-3">
          + Add row
        </button>
      )}
    </div>
  );
}
