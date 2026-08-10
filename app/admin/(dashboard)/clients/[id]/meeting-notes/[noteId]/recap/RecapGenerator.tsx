"use client";

import { useState } from "react";
import { RecapDetail } from "@/lib/db/meetingNotes";

export default function RecapGenerator({
  meetingNoteId,
  initialDecisions,
  initialDetails,
  initialRecapSlug,
  initialShortVersion,
  initialFocus,
}: {
  meetingNoteId: string;
  initialDecisions: string[] | null;
  initialDetails: RecapDetail[] | null;
  initialRecapSlug: string | null;
  initialShortVersion: string | null;
  initialFocus: string | null;
}) {
  const [decisions, setDecisions] = useState<string[]>(initialDecisions ?? []);
  const [details, setDetails] = useState<RecapDetail[]>(initialDetails ?? []);
  const [shortVersion, setShortVersion] = useState(initialShortVersion ?? "");
  const [focus, setFocus] = useState(initialFocus ?? "");
  const [recapSlug, setRecapSlug] = useState<string | null>(initialRecapSlug);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/meeting-notes/${meetingNoteId}/generate-recap`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDecisions(data.decisions);
      setDetails(data.details);
      setShortVersion(data.shortVersion);
      setFocus(data.focus);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/meeting-notes/${meetingNoteId}/publish-recap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions, details, shortVersion, focus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setRecapSlug(data.recapSlug);
    } finally {
      setPublishing(false);
    }
  }

  function updateDetail(index: number, patch: Partial<RecapDetail>) {
    setDetails((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="admin-btn px-4 py-2"
        >
          {generating ? "Generating…" : decisions.length || details.length ? "Regenerate" : "Generate"}
        </button>
        {(decisions.length > 0 || details.length > 0) && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="admin-btn-secondary px-4 py-2"
          >
            {publishing ? "Publishing…" : recapSlug ? "Republish" : "Publish"}
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {recapSlug && (
        <div className="mb-6 admin-card-blush p-4 text-sm">
          <p className="mb-1 font-heading font-[800]">Recap link</p>
          <a href={`/recap/${recapSlug}`} target="_blank" rel="noreferrer" className="text-accent underline">
            /recap/{recapSlug}
          </a>
        </div>
      )}

      {(shortVersion || focus) && (
        <div className="mb-6 grid gap-4">
          <div>
            <label className="admin-label mb-2 block">Focus</label>
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Three-to-six word phrase naming what the call was about"
              className="admin-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="admin-label mb-2 block">Short version</label>
            <textarea
              value={shortVersion}
              onChange={(e) => setShortVersion(e.target.value)}
              rows={3}
              className="admin-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {decisions.length > 0 && (
        <div className="mb-6">
          <label className="admin-label mb-2 block">Decisions</label>
          <ul className="space-y-2">
            {decisions.map((d, i) => (
              <li key={i}>
                <textarea
                  value={d}
                  onChange={(e) =>
                    setDecisions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
                  }
                  rows={2}
                  className="admin-input w-full px-3 py-2 text-sm"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {details.length > 0 && (
        <div className="mb-6">
          <label className="admin-label mb-2 block">Details</label>
          <div className="space-y-4">
            {details.map((d, i) => (
              <div key={i} className="admin-card p-4">
                <div className="mb-2 grid gap-2 sm:grid-cols-2">
                  <input
                    value={d.label}
                    onChange={(e) => updateDetail(i, { label: e.target.value })}
                    placeholder="Label"
                    className="admin-input px-3 py-2 text-sm"
                  />
                  <input
                    value={d.title}
                    onChange={(e) => updateDetail(i, { title: e.target.value })}
                    placeholder="Title"
                    className="admin-input px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  value={d.body}
                  onChange={(e) => updateDetail(i, { body: e.target.value })}
                  rows={3}
                  className="admin-input w-full px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
