"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CURRENCIES = ["GBP", "USD", "EUR"] as const;

export default function CallProposalGenerator({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [prospectName, setProspectName] = useState("");
  const [callDate, setCallDate] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("GBP");
  const [transcript, setTranscript] = useState("");
  const [pricingContext, setPricingContext] = useState("");
  const [html, setHtml] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/call-proposals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectName,
          callDate: callDate || null,
          currency,
          transcript,
          pricingContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setHtml(data.html);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/call-proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectName,
          callDate: callDate || null,
          currency,
          transcript,
          html,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/admin/leads/${leadId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="admin-label mb-1 block">Prospect name</label>
          <input
            type="text"
            value={prospectName}
            onChange={(e) => setProspectName(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Call date</label>
          <input
            type="date"
            value={callDate}
            onChange={(e) => setCallDate(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as (typeof CURRENCIES)[number])}
            className="admin-input w-full px-3 py-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="admin-label mb-1 block">Call transcript</label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={14}
          className="admin-input w-full px-3 py-2"
          placeholder="Paste the full call transcript here."
        />
      </div>

      <div className="mb-6">
        <label className="admin-label mb-1 block">
          Current offer terms / discount / capacity{" "}
          <span className="normal-case font-medium text-[#0a0608]/40">(only used if pricing wasn&apos;t discussed live on the call)</span>
        </label>
        <textarea
          value={pricingContext}
          onChange={(e) => setPricingContext(e.target.value)}
          rows={3}
          className="admin-input w-full px-3 py-2"
          placeholder="e.g. In Control, £3300, 10% off if signed by Friday, 2 spaces left this month."
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !prospectName.trim() || !transcript.trim()}
          className="admin-btn px-4 py-2"
        >
          {generating ? "Generating…" : "Generate"}
        </button>
        {html && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn-secondary px-4 py-2"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {html && (
        <>
          <div className="mb-6">
            <label className="admin-label mb-2 block">Preview</label>
            <iframe
              srcDoc={html}
              sandbox="allow-same-origin"
              className="w-full h-[80vh] border-2 border-[#0a0608] rounded-xl bg-white"
              title="Call proposal preview"
            />
          </div>

          <div className="mb-6">
            <label className="admin-label mb-1 block">
              Generated HTML <span className="normal-case font-medium text-[#0a0608]/40">(editable before saving)</span>
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={10}
              className="admin-input w-full px-3 py-2 font-mono text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
}
