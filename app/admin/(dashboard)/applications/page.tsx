import Link from "next/link";
import { listApplications } from "@/lib/db/applications";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminApplicationsPage() {
  const applications = await listApplications();

  return (
    <div>
      <h1 className="mb-6 font-heading font-[800] text-xl">Applications</h1>

      <div className="admin-card overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Business</th>
              <th>Submitted</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.applicantName}
                  <div className="text-xs text-[#0a0608]/50">{a.email}</div>
                </td>
                <td>{a.businessName || "—"}</td>
                <td>{formatDate(a.submittedAt)}</td>
                <td>{a.status}</td>
                <td className="text-right">
                  <Link href={`/admin/applications/${a.id}`} className="admin-btn-secondary text-xs px-3 py-1.5">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-[#0a0608]/50 py-6">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
