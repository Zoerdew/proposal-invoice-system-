import Link from "next/link";
import { listProposals } from "@/lib/db/proposals";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminProposalsPage() {
  const proposals = await listProposals();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading font-[800] text-xl">Proposals</h1>
        <Link href="/admin/proposals/new" className="admin-btn px-4 py-2 text-sm">
          New proposal
        </Link>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Status</th>
              <th>Date sent</th>
              <th>Link</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.clientName}
                  {p.company ? ` · ${p.company}` : ""}
                </td>
                <td>{p.status}</td>
                <td>{formatDate(p.dateSent)}</td>
                <td>
                  <a href={p.proposalLink} target="_blank" rel="noreferrer" className="text-accent underline">
                    view
                  </a>
                </td>
                <td className="text-right">
                  <Link href={`/admin/proposals/${p.id}`} className="admin-btn-secondary text-xs px-3 py-1.5">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {proposals.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#0a0608]/50 py-6">
                  No proposals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
