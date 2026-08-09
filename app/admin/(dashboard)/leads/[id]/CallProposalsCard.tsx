import Link from "next/link";
import { CallProposal } from "@/lib/db/callProposals";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CallProposalsCard({
  leadId,
  callProposals,
}: {
  leadId: string;
  callProposals: CallProposal[];
}) {
  return (
    <div className="admin-card p-6">
      <h2 className="mb-2 font-heading font-[800] text-lg">Call proposals</h2>
      <p className="mb-4 text-sm text-[#0a0608]/60">
        A private one-pager built from a sales call — separate from the signable proposal above.
      </p>
      {callProposals.length === 0 && (
        <p className="mb-4 text-sm text-[#0a0608]/50">None yet.</p>
      )}
      {callProposals.length > 0 && (
        <ul className="mb-4 space-y-2">
          {callProposals.map((cp) => (
            <li key={cp.id} className="text-sm">
              <a href={`/p/${cp.slug}`} target="_blank" rel="noreferrer" className="text-accent underline">
                {cp.prospectName}
              </a>
              <span className="text-[#0a0608]/50"> — {formatDate(cp.callDate)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/admin/leads/${leadId}/call-proposal/new`} className="admin-btn-secondary text-xs px-3 py-1.5">
        New call proposal
      </Link>
    </div>
  );
}
