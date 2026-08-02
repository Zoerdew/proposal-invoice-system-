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
        <thead className="text-left text-gray-500">
          <tr>
            <th className="w-1/2 py-1 font-medium">Description</th>
            <th className="py-1 font-medium">Kind</th>
            <th className="py-1 font-medium">Qty</th>
            <th className="py-1 font-medium">Unit price</th>
            <th className="py-1" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-gray-100">
              <td className="py-1 pr-2">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                  disabled={disabled}
                  className="w-full rounded-md border border-gray-300 px-2 py-1"
                  placeholder="Line item description"
                />
              </td>
              <td className="py-1 pr-2">
                <select
                  value={row.kind}
                  onChange={(e) => updateRow(row.key, { kind: e.target.value as RowKind })}
                  disabled={disabled}
                  className="rounded-md border border-gray-300 px-2 py-1"
                >
                  <option value="Fixed">Fixed</option>
                  <option value="Package Option">Package Option</option>
                  <option value="Add-on">Add-on</option>
                </select>
              </td>
              <td className="py-1 pr-2">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(row.key, { quantity: Number(e.target.value) || 0 })
                  }
                  disabled={disabled}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1"
                  step="0.01"
                />
              </td>
              <td className="py-1 pr-2">
                <input
                  type="number"
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateRow(row.key, { unitPrice: Number(e.target.value) || 0 })
                  }
                  disabled={disabled}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1"
                  step="0.01"
                />
              </td>
              <td className="py-1">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                    className="text-gray-400 hover:text-red-600"
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
        <button
          type="button"
          onClick={() => onChange([...rows, emptyRow()])}
          className="mt-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          + Add row
        </button>
      )}
    </div>
  );
}
