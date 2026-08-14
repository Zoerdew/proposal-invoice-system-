"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProposal({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setConfirming(false);
        return;
      }
      router.push("/admin/proposals");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-6 admin-card p-6">
      <h2 className="mb-2 font-heading font-[800] text-lg">Delete</h2>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {confirming ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#0a0608]/60">
            Permanently delete this proposal? This can&apos;t be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="admin-btn px-4 py-2 text-sm"
              style={{ background: "#dc2626" }}
            >
              {deleting ? "Deleting…" : "Yes, delete it"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="admin-btn-secondary px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="admin-btn-secondary px-4 py-2 text-sm">
          Delete proposal
        </button>
      )}
    </div>
  );
}
