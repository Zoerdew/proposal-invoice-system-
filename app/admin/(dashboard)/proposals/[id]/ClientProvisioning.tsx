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
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold">Client & onboarding</h2>
      {existingPortalToken ? (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Client record exists. Portal link:
          </p>
          <p className="mb-4 break-all rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
            /c/{existingPortalToken}/onboarding
          </p>
          <p className="mb-4 text-xs text-gray-500">
            Clicking below resends the onboarding email to this client — only use it if they
            genuinely haven&apos;t received it.
          </p>
        </>
      ) : (
        <p className="mb-4 text-sm text-gray-600">
          No client record yet — this runs automatically on signature. Only use this if that
          failed.
        </p>
      )}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={sending}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {sending
          ? "Sending…"
          : existingPortalToken
            ? "Resend onboarding email"
            : "Create client & send onboarding email"}
      </button>
    </div>
  );
}
