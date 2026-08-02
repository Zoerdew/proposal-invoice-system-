"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LineItemRows, { LineItemRow, emptyRow } from "../../components/LineItemRows";
import { PLACEHOLDER_TOKENS } from "@/lib/placeholders";
import { ALL_PAYMENT_PLANS, PaymentPlan } from "@/lib/paymentPlans";

export default function OfferForm({
  mode,
  offerId,
  initial,
}: {
  mode: "create" | "edit";
  offerId?: string;
  initial?: {
    name: string;
    tagline: string;
    description: string;
    contractTerms: string;
    rows: LineItemRow[];
    paymentPlans: PaymentPlan[];
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contractTerms, setContractTerms] = useState(initial?.contractTerms ?? "");
  const [rows, setRows] = useState<LineItemRow[]>(initial?.rows ?? [emptyRow()]);
  const [paymentPlans, setPaymentPlans] = useState<Set<PaymentPlan>>(
    new Set(initial?.paymentPlans ?? [])
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePlan(plan: PaymentPlan) {
    setPaymentPlans((prev) => {
      const next = new Set(prev);
      if (next.has(plan)) next.delete(plan);
      else next.add(plan);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const body = {
      name,
      tagline,
      description,
      contractTerms,
      paymentPlans: Array.from(paymentPlans),
      lineItems: rows.map(({ description, kind, quantity, unitPrice }) => ({
        description,
        kind,
        quantity,
        unitPrice,
      })),
    };
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/offers" : `/api/admin/offers/${offerId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      if (mode === "create") {
        router.push(`/admin/offers/${data.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">Offer name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tagline <span className="font-normal text-gray-400">(shown on the proposal page)</span>
        </label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="A 90-day, one-to-one virtual advisory engagement"
        />
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Description <span className="font-normal text-gray-400">(what's included)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="Six calls, a GOLD Report, an Evidence Dashboard..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Same for every proposal built from this offer — shown prominently on the client-facing
          proposal page.
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Payment plans offered
        </label>
        <div className="space-y-1">
          {ALL_PAYMENT_PLANS.map((plan) => (
            <label key={plan} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={paymentPlans.has(plan)}
                onChange={() => togglePlan(plan)}
              />
              {plan}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          None checked = Pay in Full only (no payment choice shown to the client).
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Default contract terms
        </label>
        <textarea
          value={contractTerms}
          onChange={(e) => setContractTerms(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Placeholders: {PLACEHOLDER_TOKENS.join(", ")} — get swapped for the real client
          details when filling in a proposal built from this offer. {"{{Total}}"} and{" "}
          {"{{Payment Plan}}"} fill in automatically once the client confirms their options, and
          stay correct even if the price changes later.
        </p>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Default line items
        </label>
        <LineItemRows rows={rows} onChange={setRows} />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
