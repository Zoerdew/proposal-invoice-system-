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

  async function loadOffer() {
    if (!selectedOfferId) return;
    setLoadingOffer(true);
    try {
      const res = await fetch(`/api/admin/offers/${selectedOfferId}`);
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

  async function handleSave(markSent?: boolean) {
    setSaving(true);
    setError(null);
    const body = {
      clientName,
      clientEmail,
      company,
      contractTerms,
      offerId: selectedOfferId || null,
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
              onChange={(e) => setSelectedOfferId(e.target.value)}
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
            onClick={loadOffer}
            disabled={!selectedOfferId || loadingOffer}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            {loadingOffer ? "Loading…" : "Load"}
          </button>
        </div>
      )}

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">Line items</label>
        <LineItemRows rows={rows} onChange={setRows} disabled={locked} />
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
              disabled={saving || !clientName.trim()}
              className="rounded-md border border-gray-300 px-4 py-2 font-medium disabled:opacity-40"
            >
              Save & mark as sent
            </button>
          )}
        </div>
      )}
    </div>
  );
}
