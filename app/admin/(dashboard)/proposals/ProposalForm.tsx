"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LineItemRows, { LineItemRow, emptyRow } from "../../components/LineItemRows";
import {
  PLACEHOLDER_TOKENS,
  resolvePlaceholders,
  todayFormatted,
} from "@/lib/placeholders";

interface OfferOption {
  id: string;
  name: string;
}

interface InitialProposal {
  clientName: string;
  clientEmail: string;
  company: string;
  contractTerms: string;
  rows: LineItemRow[];
  status: string;
  proposalLink: string | null;
  offerId: string | null;
  depositAmount: number | null;
}

const LOCKED_STATUSES = ["Signed", "Invoiced", "Paid"];

export default function ProposalForm({
  mode,
  proposalId,
  offers,
  initial,
}: {
  mode: "create" | "edit";
  proposalId?: string;
  offers: OfferOption[];
  initial?: InitialProposal;
}) {
  const router = useRouter();
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [contractTerms, setContractTerms] = useState(initial?.contractTerms ?? "");
  const [rows, setRows] = useState<LineItemRow[]>(initial?.rows ?? [emptyRow()]);
  const [selectedOfferId, setSelectedOfferId] = useState(initial?.offerId ?? "");
  const [depositAmount, setDepositAmount] = useState(
    initial?.depositAmount ? String(initial.depositAmount) : ""
  );
  const [loadingOffer, setLoadingOffer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLink, setSavedLink] = useState<string | null>(initial?.proposalLink ?? null);

  const locked = mode === "edit" && LOCKED_STATUSES.includes(initial?.status ?? "");

  function fillPlaceholders() {
    setContractTerms((current) =>
      resolvePlaceholders(current, {
        clientName,
        company,
        clientEmail,
        date: todayFormatted(),
      })
    );
  }

  async function loadOffer(offerId: string) {
    if (!offerId) return;
    setLoadingOffer(true);
    try {
      const res = await fetch(`/api/admin/offers/${offerId}`);
      if (!res.ok) return;
      const data = await res.json();
      setContractTerms(data.contractTerms ?? "");
      setRows(
        data.rows.length > 0
          ? data.rows.map((r: Omit<LineItemRow, "key">) => ({ ...r, key: crypto.randomUUID() }))
          : [emptyRow()]
      );
    } finally {
      setLoadingOffer(false);
    }
  }

  function handleOfferSelect(offerId: string) {
    setSelectedOfferId(offerId);
    // Linking an offer without pulling in its content is what left Eloise's
    // proposal with no contract terms at all — picking one now loads it
    // immediately, no separate click required. "Load" stays below as an
    // explicit way to reset back to the offer's defaults after editing.
    if (offerId) loadOffer(offerId);
  }

  async function handleSave(markSent?: boolean) {
    setSaving(true);
    setError(null);
    const body = {
      clientName,
      clientEmail,
      company,
      contractTerms,
      offerId: selectedOfferId || null,
      depositAmount: depositAmount.trim() ? Number(depositAmount) : null,
      lineItems: rows.map(({ description, kind, quantity, unitPrice }) => ({
        description,
        kind,
        quantity,
        unitPrice,
      })),
      ...(markSent ? { markSent: true } : {}),
    };
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        router.push(`/admin/proposals/${data.id}`);
      } else {
        const res = await fetch(`/api/admin/proposals/${proposalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        setSavedLink(data.proposalLink ?? savedLink);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {savedLink && (
        <div className="mb-6 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
          <p className="mb-1 font-medium">Proposal link</p>
          <a href={savedLink} target="_blank" rel="noreferrer" className="text-blue-700 underline">
            {savedLink}
          </a>
        </div>
      )}

      {locked && (
        <p className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          This proposal has already been signed and can no longer be edited.
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Client name</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            disabled={locked}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Client email</label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            disabled={locked}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={locked}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      {!locked && offers.length > 0 && (
        <div className="mb-6 flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Load from an offer template
            </label>
            <select
              value={selectedOfferId}
              onChange={(e) => handleOfferSelect(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">— choose an offer —</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => loadOffer(selectedOfferId)}
            disabled={!selectedOfferId || loadingOffer}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
            title="Reset contract terms and line items back to this offer's defaults"
          >
            {loadingOffer ? "Loading…" : "Reload defaults"}
          </button>
        </div>
      )}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">Line items</label>
        <LineItemRows rows={rows} onChange={setRows} disabled={locked} />
      </div>

      <div className="mb-6 sm:w-1/3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Deposit amount (optional)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          disabled={locked}
          placeholder="e.g. 500"
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {!locked && (
          <p className="mt-1 text-xs text-gray-500">
            One-off exception for this client only. If set, whatever payment plan they choose
            becomes: this amount now, then the rest split evenly across that plan&apos;s months
            (e.g. Pay in 3 becomes deposit + 3 more payments).
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Contract terms</label>
          {!locked && (
            <button
              type="button"
              onClick={fillPlaceholders}
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Fill placeholders
            </button>
          )}
        </div>
        <textarea
          value={contractTerms}
          onChange={(e) => setContractTerms(e.target.value)}
          disabled={locked}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
        {!locked && (
          <p className="mt-1 text-xs text-gray-500">
            Placeholders: {PLACEHOLDER_TOKENS.join(", ")} — set your line items above first, then
            click &quot;Fill placeholders&quot; last to swap the tokens for real values.{" "}
            <strong>{"{{Total}}"}</strong> and <strong>{"{{Payment Plan}}"}</strong> fill in
            automatically once the client confirms their options, and stay in sync even if you
            change the price later.
          </p>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {!locked && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving || !clientName.trim()}
            className="rounded-md bg-gray-900 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {mode === "edit" && initial?.status === "Draft" && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving || !clientName.trim() || !contractTerms.trim()}
              className="rounded-md border border-gray-300 px-4 py-2 font-medium disabled:opacity-40"
            >
              Save & mark as sent
            </button>
          )}
        </div>
      )}
      {!locked && mode === "edit" && initial?.status === "Draft" && !contractTerms.trim() && (
        <p className="mt-2 text-sm text-red-600">
          Contract terms are empty — add them (or click &quot;Load&quot; above) before you can
          mark this as sent.
        </p>
      )}
    </div>
  );
}
