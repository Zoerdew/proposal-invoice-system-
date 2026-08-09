"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APPLICATION_STATUS_OPTIONS, ApplicationStatus } from "@/lib/db/applicationChoices";

export default function ApplicationReviewForm({
  applicationId,
  initialStatus,
  initialFitNotes,
}: {
  applicationId: string;
  initialStatus: ApplicationStatus;
  initialFitNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [fitNotes, setFitNotes] = useState(initialFitNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, fitNotesPrivate: fitNotes }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-card p-6">
      <h2 className="mb-4 font-heading font-[800] text-lg">Review</h2>

      <label className="admin-label mb-1 block">Status</label>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
        className="admin-input mb-4 w-full px-3 py-2"
      >
        {APPLICATION_STATUS_OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      <label className="admin-label mb-1 block">Fit notes (private)</label>
      <textarea
        value={fitNotes}
        onChange={(e) => setFitNotes(e.target.value)}
        rows={4}
        className="admin-input mb-4 w-full px-3 py-2"
        placeholder="Never shown to the applicant."
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button onClick={handleSave} disabled={saving} className="admin-btn px-4 py-2 text-sm">
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
