"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_STATUS_OPTIONS, ClientStatus } from "@/lib/db/clientChoices";
import { ALL_PAYMENT_PLANS, PaymentPlan } from "@/lib/paymentPlans";

interface InitialClient {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  status: ClientStatus | null;
  startDate: string | null;
  endDate: string | null;
  packagePrice: number | null;
  paymentPlan: PaymentPlan | null;
  commercialObjectives: string;
  notes: string;
  targetFigure: number | null;
  baselineMonthlyRevenue: number | null;
  baselineRepeatBuyerPct: number | null;
  annualTurnover: number | null;
  baselineDate: string | null;
}

function dateOnly(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export default function ClientForm({ clientId, initial }: { clientId: string; initial: InitialClient }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initial.email);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [status, setStatus] = useState<ClientStatus | "">(initial.status ?? "");
  const [startDate, setStartDate] = useState(dateOnly(initial.startDate));
  const [endDate, setEndDate] = useState(dateOnly(initial.endDate));
  const [packagePrice, setPackagePrice] = useState(initial.packagePrice?.toString() ?? "");
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan | "">(initial.paymentPlan ?? "");
  const [commercialObjectives, setCommercialObjectives] = useState(initial.commercialObjectives);
  const [notes, setNotes] = useState(initial.notes);
  const [targetFigure, setTargetFigure] = useState(initial.targetFigure?.toString() ?? "");
  const [baselineMonthlyRevenue, setBaselineMonthlyRevenue] = useState(
    initial.baselineMonthlyRevenue?.toString() ?? ""
  );
  const [baselineRepeatBuyerPct, setBaselineRepeatBuyerPct] = useState(
    initial.baselineRepeatBuyerPct?.toString() ?? ""
  );
  const [annualTurnover, setAnnualTurnover] = useState(initial.annualTurnover?.toString() ?? "");
  const [baselineDate, setBaselineDate] = useState(dateOnly(initial.baselineDate));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          firstName,
          lastName,
          email,
          businessName,
          status: status || null,
          startDate: startDate || null,
          endDate: endDate || null,
          packagePrice: packagePrice.trim() ? Number(packagePrice) : null,
          paymentPlan: paymentPlan || null,
          commercialObjectives,
          notes,
          targetFigure: targetFigure.trim() ? Number(targetFigure) : null,
          baselineMonthlyRevenue: baselineMonthlyRevenue.trim() ? Number(baselineMonthlyRevenue) : null,
          baselineRepeatBuyerPct: baselineRepeatBuyerPct.trim() ? Number(baselineRepeatBuyerPct) : null,
          annualTurnover: annualTurnover.trim() ? Number(annualTurnover) : null,
          baselineDate: baselineDate || null,
        }),
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

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Details</h2>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>First name</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Last name</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Business name</label>
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
            className={inputClass}
          >
            <option value="">—</option>
            {CLIENT_STATUS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Package price</label>
          <input
            type="number"
            step="0.01"
            value={packagePrice}
            onChange={(e) => setPackagePrice(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Payment plan</label>
          <select
            value={paymentPlan}
            onChange={(e) => setPaymentPlan(e.target.value as PaymentPlan)}
            className={inputClass}
          >
            <option value="">—</option>
            {ALL_PAYMENT_PLANS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>Commercial objectives</label>
        <textarea
          rows={3}
          value={commercialObjectives}
          onChange={(e) => setCommercialObjectives(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="mb-4">
        <label className={labelClass}>Notes</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </div>

      <h3 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Baseline (fills in from onboarding, editable here)
      </h3>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Target figure</label>
          <input
            type="number"
            step="0.01"
            value={targetFigure}
            onChange={(e) => setTargetFigure(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Annual turnover</label>
          <input
            type="number"
            step="0.01"
            value={annualTurnover}
            onChange={(e) => setAnnualTurnover(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Baseline monthly revenue</label>
          <input
            type="number"
            step="0.01"
            value={baselineMonthlyRevenue}
            onChange={(e) => setBaselineMonthlyRevenue(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Baseline repeat buyer %</label>
          <input
            type="number"
            step="0.01"
            value={baselineRepeatBuyerPct}
            onChange={(e) => setBaselineRepeatBuyerPct(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Baseline date</label>
          <input
            type="date"
            value={baselineDate}
            onChange={(e) => setBaselineDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
