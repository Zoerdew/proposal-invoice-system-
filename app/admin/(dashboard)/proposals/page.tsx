import Link from "next/link";
import { listProposals } from "@/lib/db/proposals";

export const dynamic = "force-dynamic";

export default async function AdminProposalsPage() {
  const proposals = await listProposals();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Proposals</h1>
        <Link
          href="/admin/proposals/new"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          New proposal
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Link</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  {p.clientName}
                  {p.company ? ` · ${p.company}` : ""}
                </td>
                <td className="px-4 py-2">{p.status}</td>
                <td className="px-4 py-2">
                  <a
                    href={p.proposalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline"
                  >
                    view
                  </a>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/proposals/${p.id}`} className="text-gray-700 underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {proposals.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
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
