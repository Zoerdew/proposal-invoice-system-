"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConvertToProposal({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setConverting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/convert`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/admin/proposals/${data.proposalId}`);
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-2 text-lg font-semibold">Convert</h2>
      <p className="mb-4 text-sm text-gray-600">
        Creates a draft proposal pre-filled with this applicant&apos;s name, email, and business —
        offer, line items, and contract terms still need filling in.
      </p>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleClick}
        disabled={converting}
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {converting ? "Converting…" : "Convert to proposal"}
      </button>
    </div>
  );
}
