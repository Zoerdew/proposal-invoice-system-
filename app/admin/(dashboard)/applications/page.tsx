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
      <h1 className="mb-6 text-xl font-semibold">Applications</h1>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Applicant</th>
              <th className="px-4 py-2 font-medium">Business</th>
              <th className="px-4 py-2 font-medium">Submitted</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-2">
                  {a.applicantName}
                  <div className="text-xs text-gray-500">{a.email}</div>
                </td>
                <td className="px-4 py-2">{a.businessName || "—"}</td>
                <td className="px-4 py-2">{formatDate(a.submittedAt)}</td>
                <td className="px-4 py-2">{a.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/applications/${a.id}`} className="text-gray-700 underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
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
