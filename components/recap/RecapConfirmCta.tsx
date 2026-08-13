"use client";

import { useState } from "react";

export default function RecapConfirmCta({
  slug,
  initialConfirmed,
}: {
  slug: string;
  initialConfirmed: boolean;
}) {
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/recap/${slug}/confirm`, { method: "POST" });
      if (!res.ok) {
        setError("Something went wrong — try again, or just reply to Zoë directly.");
        return;
      }
      setConfirmed(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="bg-[#0a0608] text-cream rounded-[20px] p-8 text-center">
        <p className="font-heading font-[800] text-xl mb-2">Confirmed.</p>
        <p className="text-cream/70 max-w-md mx-auto">
          Zoë&apos;s been notified — she&apos;ll follow up to get things moving.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cream rounded-[20px] border-2 border-[#0a0608] p-8 text-center">
      <p className="font-heading font-[800] text-xl mb-2">Ready to go ahead?</p>
      <p className="text-[#0a0608]/60 max-w-md mx-auto mb-6">
        One click sends Zoë a note to say you&apos;re in — she&apos;ll take it from there.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        className="btn-pill px-8 py-3"
      >
        {submitting ? "Sending…" : "Confirm you want to go ahead"}
      </button>
      {error && <p className="mt-4 text-sm text-[#F11787]">{error}</p>}
    </div>
  );
}
