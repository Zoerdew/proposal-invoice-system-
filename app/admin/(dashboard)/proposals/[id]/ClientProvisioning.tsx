"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientProvisioning({
  proposalId,
  existingPortalToken,
}: {
  proposalId: string;
  existingPortalToken: string | null;
}) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}/create-client`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="admin-card p-6">
      <h2 className="mb-2 font-heading font-[800] text-lg">Client & onboarding</h2>
      {existingPortalToken ? (
        <>
          <p className="mb-4 text-sm text-[#0a0608]/60">
            Client record exists. Portal link:
          </p>
          <p className="mb-4 break-all admin-input px-3 py-2 text-xs">
            /c/{existingPortalToken}/onboarding
          </p>
          <p className="mb-4 text-xs text-[#0a0608]/50">
            Clicking below resends the onboarding email to this client — only use it if they
            genuinely haven&apos;t received it.
          </p>
        </>
      ) : (
        <p className="mb-4 text-sm text-[#0a0608]/60">
          No client record yet — this runs automatically on signature. Only use this if that
          failed.
        </p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button onClick={handleClick} disabled={sending} className="admin-btn-secondary px-4 py-2 text-sm">
        {sending
          ? "Sending…"
          : existingPortalToken
            ? "Resend onboarding email"
            : "Create client & send onboarding email"}
      </button>
    </div>
  );
}
