import Link from "next/link";
import { listClientsAdmin } from "@/lib/db/clients";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await listClientsAdmin();

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">Clients</h1>

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Business</th>
              <th>Status</th>
              <th>Onboarding</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>
                  {c.name}
                  <div className="text-xs text-[#0a0608]/50">{c.email}</div>
                </td>
                <td>{c.businessName || "—"}</td>
                <td>{c.status ?? "—"}</td>
                <td>
                  <span className={c.onboardingComplete ? "badge badge-pos" : "badge badge-neutral"}>
                    {c.onboardingComplete ? "Complete" : "Pending"}
                  </span>
                </td>
                <td className="text-right">
                  <Link href={`/admin/clients/${c.id}`} className="admin-btn-secondary text-xs px-3 py-1.5">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#0a0608]/50 py-6">
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
