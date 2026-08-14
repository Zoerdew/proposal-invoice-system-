"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { currency } from "@/lib/currency";
import { PaymentPlan, computeInstallments } from "@/lib/paymentPlans";

interface LineItem {
  id: string;
  description: string;
  lineTotal: number;
}

export default function OptionsForm({
  slug,
  fixedTotal,
  packageOptions,
  addons,
  paymentPlans,
}: {
  slug: string;
  fixedTotal: number;
  packageOptions: LineItem[];
  addons: LineItem[];
  paymentPlans: PaymentPlan[];
}) {
  const router = useRouter();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    packageOptions[0]?.id ?? null
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>(paymentPlans[0] ?? "Pay in Full");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => {
    const optionTotal =
      packageOptions.find((o) => o.id === selectedOptionId)?.lineTotal ?? 0;
    const addonsTotal = addons
      .filter((a) => selectedAddonIds.has(a.id))
      .reduce((sum, a) => sum + a.lineTotal, 0);
    return fixedTotal + optionTotal + addonsTotal;
  }, [fixedTotal, packageOptions, addons, selectedOptionId, selectedAddonIds]);

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/select-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          selectedOptionId,
          selectedAddonIds: Array.from(selectedAddonIds),
          paymentPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/proposal/${slug}/contract`);
    } finally {
      setSubmitting(false);
    }
  }

  const hasChoices = packageOptions.length > 0 || addons.length > 0 || paymentPlans.length > 1;

  return (
    <div className="card-brutal p-6">
      {packageOptions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-heading font-[800]">Choose an option</h2>
          <div className="space-y-2">
            {packageOptions.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-[#0a0608]/15 px-4 py-3 has-[:checked]:border-[#0a0608] has-[:checked]:shadow-[3px_3px_0_#F11787]"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="package-option"
                    checked={selectedOptionId === option.id}
                    onChange={() => setSelectedOptionId(option.id)}
                    className="accent-[#F11787]"
                  />
                  {option.description}
                </span>
                <span className="font-heading font-[800]">{currency.format(option.lineTotal)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {addons.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-heading font-[800]">Optional add-ons</h2>
          <div className="space-y-2">
            {addons.map((addon) => (
              <label
                key={addon.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-[#0a0608]/15 px-4 py-3 has-[:checked]:border-[#0a0608] has-[:checked]:shadow-[3px_3px_0_#F11787]"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedAddonIds.has(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                    className="accent-[#F11787]"
                  />
                  {addon.description}
                </span>
                <span className="font-heading font-[800]">{currency.format(addon.lineTotal)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {paymentPlans.length > 1 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-heading font-[800]">Choose how to pay</h2>
          <div className="space-y-2">
            {paymentPlans.map((plan) => {
              const installments = computeInstallments(total, plan, new Date());
              return (
                <label
                  key={plan}
                  className="flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-[#0a0608]/15 px-4 py-3 has-[:checked]:border-[#0a0608] has-[:checked]:shadow-[3px_3px_0_#F11787]"
                >
                  <span className="flex cursor-pointer items-center justify-between">
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment-plan"
                        checked={paymentPlan === plan}
                        onChange={() => setPaymentPlan(plan)}
                        className="accent-[#F11787]"
                      />
                      {plan}
                    </span>
                    <span className="font-heading font-[800]">
                      {installments.length === 1
                        ? currency.format(installments[0].amount)
                        : `${installments.length} × ${currency.format(installments[0].amount)}`}
                    </span>
                  </span>
                  {plan === "Pay in 6" && (
                    <span className="pl-7 text-xs text-[#0a0608]/60">
                      Start date is once your first 3 payments are made — 3 months from your first
                      payment.
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between border-t-2 border-[#0a0608]/15 pt-4 text-lg">
        <span className="font-heading font-[800]">Total</span>
        <span className="font-heading font-[800] text-accent">{currency.format(total)}</span>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className="btn-pill w-full px-6 py-3 text-sm"
      >
        {submitting ? "Saving…" : hasChoices ? "Continue to contract" : "Continue"}
      </button>
    </div>
  );
}
