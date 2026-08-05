import { currency } from "./currency";

export type PaymentPlan = "Pay in Full" | "Pay in 3" | "Pay in 6";

export const PLAN_INSTALLMENTS: Record<PaymentPlan, number> = {
  "Pay in Full": 1,
  "Pay in 3": 3,
  "Pay in 6": 6,
};

export const ALL_PAYMENT_PLANS: PaymentPlan[] = ["Pay in Full", "Pay in 3", "Pay in 6"];

export interface Installment {
  sequence: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
}

// Matches the grace period in the Payment clause (7 days) — overridable via
// the same env var the original single-invoice flow used.
export function getFirstDueDate(): Date {
  const days = Number(process.env.XERO_INVOICE_DUE_DAYS) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// Splits total evenly across N installments, folding the rounding remainder
// into the last one so they sum exactly to total. firstDueDate is the grace
// period Zoë's contract already promises (7 days, per the Payment clause);
// later installments are then a month apart from that, not from today.
//
// depositOverride is a one-off, per-proposal exception (set via the admin
// builder's "Deposit amount" field) for a client who's negotiated a fixed
// upfront payment on top of the plan they pick — e.g. "£500 now, then the
// rest split across the plan's months." It's paid *in addition to* the
// plan's installments, not carved out of them: "Pay in 3" with a £500
// deposit is 4 payments total (deposit + 3), not 3.
export function computeInstallments(
  total: number,
  plan: PaymentPlan,
  firstDueDate: Date,
  depositOverride?: number
): Installment[] {
  const count = PLAN_INSTALLMENTS[plan];

  if (depositOverride && depositOverride > 0 && count > 1) {
    const remaining = total - depositOverride;
    const base = Math.round((remaining / count) * 100) / 100;
    const installments: Installment[] = [
      { sequence: 1, amount: depositOverride, dueDate: firstDueDate.toISOString().slice(0, 10) },
    ];
    let runningTotal = depositOverride;

    for (let i = 0; i < count; i++) {
      const isLast = i === count - 1;
      const amount = isLast ? Math.round((total - runningTotal) * 100) / 100 : base;
      runningTotal += amount;
      installments.push({
        sequence: i + 2,
        amount,
        dueDate: addMonths(firstDueDate, i + 1).toISOString().slice(0, 10),
      });
    }

    return installments;
  }

  const base = Math.round((total / count) * 100) / 100;
  const installments: Installment[] = [];
  let runningTotal = 0;

  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1;
    const amount = isLast ? Math.round((total - runningTotal) * 100) / 100 : base;
    runningTotal += amount;
    installments.push({
      sequence: i + 1,
      amount,
      dueDate: addMonths(firstDueDate, i).toISOString().slice(0, 10),
    });
  }

  return installments;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Takes the already-computed schedule directly — never recomputes dates —
// so the contract text can never drift from what Xero actually invoices.
export function describePaymentPlan(installments: Installment[]): string {
  if (installments.length === 1) {
    const only = installments[0];
    return `Payment of ${currency.format(only.amount)} is due in full by ${dateFormat.format(
      new Date(only.dueDate)
    )}.`;
  }

  const parts = installments.map(
    (i) => `${currency.format(i.amount)} due ${dateFormat.format(new Date(i.dueDate))}`
  );
  const last = parts.pop();
  return `Payment will be made in ${installments.length} instalments: ${parts.join(
    ", "
  )}, and ${last}.`;
}
