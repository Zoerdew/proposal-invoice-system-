import Link from "next/link";
import { LEAD_STAGE_OPTIONS, LeadStage, listLeads } from "@/lib/db/leads";
import { listProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; product?: string }>;
}) {
  const { stage, product } = await searchParams;
  const isValidStage = (LEAD_STAGE_OPTIONS as readonly string[]).includes(stage ?? "");

  const [leads, products] = await Promise.all([
    listLeads({
      stage: isValidStage ? (stage as LeadStage) : undefined,
      productId: product || undefined,
    }),
    listProducts(),
  ]);

  const productName = (id: string | null) => products.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading font-[800] text-xl">Leads</h1>
        <Link href="/admin/leads/new" className="admin-btn px-4 py-2 text-sm">
          New lead
        </Link>
      </div>

      <form method="get" className="mb-4 flex flex-wrap gap-3">
        <select name="stage" defaultValue={stage ?? ""} className="admin-input px-3 py-2 text-sm">
          <option value="">All stages</option>
          {LEAD_STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="product" defaultValue={product ?? ""} className="admin-input px-3 py-2 text-sm">
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button type="submit" className="admin-btn-secondary px-4 py-2 text-sm">
          Filter
        </button>
        {(stage || product) && (
          <Link href="/admin/leads" className="admin-btn-secondary px-4 py-2 text-sm">
            Clear
          </Link>
        )}
      </form>

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Offer</th>
              <th>Stage</th>
              <th>Value</th>
              <th>First contact</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  {`${l.firstName} ${l.lastName}`.trim() || "—"}
                  {l.email ? <div className="text-xs text-[#0a0608]/50">{l.email}</div> : null}
                </td>
                <td>{productName(l.productId)}</td>
                <td>{l.leadStage}</td>
                <td>{l.leadValue != null ? `£${l.leadValue}` : "—"}</td>
                <td>{formatDate(l.firstContactDate)}</td>
                <td className="text-right">
                  <Link href={`/admin/leads/${l.id}`} className="admin-btn-secondary text-xs px-3 py-1.5">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-[#0a0608]/50 py-6">
                  No leads yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
