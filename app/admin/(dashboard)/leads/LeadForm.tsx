"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_STAGE_OPTIONS, LeadStage } from "@/lib/db/leadChoices";

interface ProductOption {
  id: string;
  name: string;
}

interface InitialLead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  productId: string | null;
  leadStage: LeadStage;
  leadValue: number | null;
  conversionProbability: number | null;
  notes: string;
  firstContactDate: string | null;
  closeDate: string | null;
  daysUntilNextContact: number | null;
  updatedAt: string;
}

function nextContactDateLabel(updatedAt: string, days: number | null): string | null {
  if (days == null) return null;
  const next = new Date(updatedAt);
  next.setDate(next.getDate() + days);
  return next.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function LeadForm({
  mode,
  leadId,
  products,
  initial,
}: {
  mode: "create" | "edit";
  leadId?: string;
  products: ProductOption[];
  initial?: InitialLead;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [productId, setProductId] = useState(initial?.productId ?? "");
  const [leadStage, setLeadStage] = useState<LeadStage>(initial?.leadStage ?? "New");
  const [leadValue, setLeadValue] = useState(
    initial?.leadValue != null ? String(initial.leadValue) : ""
  );
  const [conversionProbability, setConversionProbability] = useState(
    initial?.conversionProbability != null ? String(initial.conversionProbability) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [firstContactDate, setFirstContactDate] = useState(initial?.firstContactDate ?? "");
  const [closeDate, setCloseDate] = useState(initial?.closeDate ?? "");
  const [daysUntilNextContact, setDaysUntilNextContact] = useState(
    initial?.daysUntilNextContact != null ? String(initial.daysUntilNextContact) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextContact =
    initial && daysUntilNextContact.trim()
      ? nextContactDateLabel(initial.updatedAt, Number(daysUntilNextContact))
      : null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const body = {
      firstName,
      lastName,
      email,
      phone,
      source,
      productId: productId || null,
      leadStage,
      leadValue: leadValue.trim() ? Number(leadValue) : null,
      conversionProbability: conversionProbability.trim() ? Number(conversionProbability) : null,
      notes,
      firstContactDate: firstContactDate || null,
      closeDate: closeDate || null,
      daysUntilNextContact: daysUntilNextContact.trim() ? Number(daysUntilNextContact) : null,
    };
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/leads" : `/api/admin/leads/${leadId}`,
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
        router.push(`/admin/leads/${data.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="admin-label mb-1 block">First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="admin-label mb-1 block">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Source</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="admin-input w-full px-3 py-2"
            placeholder="e.g. Instagram DM, referral"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Offer interested in</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="admin-input w-full px-3 py-2"
          >
            <option value="">— none —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="admin-label mb-1 block">Lead stage</label>
          <select
            value={leadStage}
            onChange={(e) => setLeadStage(e.target.value as LeadStage)}
            className="admin-input w-full px-3 py-2"
          >
            {LEAD_STAGE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-label mb-1 block">Lead value (£)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={leadValue}
            onChange={(e) => setLeadValue(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Conversion probability (%)</label>
          <input
            type="number"
            step="1"
            min="0"
            max="100"
            value={conversionProbability}
            onChange={(e) => setConversionProbability(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="admin-label mb-1 block">First contact date</label>
          <input
            type="date"
            value={firstContactDate}
            onChange={(e) => setFirstContactDate(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Close date</label>
          <input
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
        </div>
        <div>
          <label className="admin-label mb-1 block">Days until next contact</label>
          <input
            type="number"
            step="1"
            min="0"
            value={daysUntilNextContact}
            onChange={(e) => setDaysUntilNextContact(e.target.value)}
            className="admin-input w-full px-3 py-2"
          />
          {nextContact && (
            <p className="mt-1 text-xs text-[#0a0608]/50">Next contact: {nextContact}</p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="admin-label mb-1 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="admin-input w-full px-3 py-2"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || (!firstName.trim() && !lastName.trim())}
        className="admin-btn px-4 py-2"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
