import Link from "next/link";
import { listClientsAdmin } from "@/lib/db/clients";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await listClientsAdmin();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Clients</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Business</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Onboarding</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  {c.name}
                  <div className="text-xs text-gray-500">{c.email}</div>
                </td>
                <td className="px-4 py-2">{c.businessName || "—"}</td>
                <td className="px-4 py-2">{c.status ?? "—"}</td>
                <td className="px-4 py-2">{c.onboardingComplete ? "Complete" : "Pending"}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/clients/${c.id}`} className="text-gray-700 underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No clients yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
