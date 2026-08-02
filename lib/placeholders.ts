export interface PlaceholderValues {
  clientName: string;
  company: string;
  clientEmail: string;
  date: string;
}

// Keep this list in sync with the hint text shown next to Contract Terms
// in both the Offer and Proposal admin forms.
export const PLACEHOLDER_TOKENS = [
  "{{Client Name}}",
  "{{Company}}",
  "{{Client Email}}",
  "{{Date}}",
] as const;

// {{Total}} and {{Payment Plan}} aren't in PLACEHOLDER_TOKENS/resolvePlaceholders
// above — deliberately. Both depend on the price actually charged, which can
// change after Zoë first authors the contract text (a discount, a corrected
// line item). Resolving them here, once, at admin-authoring time is exactly
// what caused prices to go stale in the contract after a later price edit.
// Instead both are resolved server-side in /api/select-options, idempotently,
// every time the client (re)confirms their options — see resolveTotalPlaceholder
// and resolvePaymentPlanPlaceholder below.
export function resolvePlaceholders(text: string, values: PlaceholderValues): string {
  return text
    .replaceAll("{{Client Name}}", values.clientName)
    .replaceAll("{{Company}}", values.company)
    .replaceAll("{{Client Email}}", values.clientEmail)
    .replaceAll("{{Date}}", values.date);
}

export function todayFormatted(): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

// {{Payment Plan}} isn't in PLACEHOLDER_TOKENS/resolvePlaceholders above —
// unlike the other tokens, it isn't known when Zoë authors the proposal.
// It's resolved server-side in /api/select-options once the client actually
// picks a plan, so it gets its own resolution step.
export function resolvePaymentPlanPlaceholder(text: string, description: string): string {
  return text.replaceAll("{{Payment Plan}}", description);
}

// Same idempotent shape as resolvePaymentPlanPlaceholder: the caller passes
// the exact previously-resolved total (if any) so it can be swapped for the
// new one, falling back to the raw token on first resolution.
export function resolveTotalPlaceholder(text: string, total: string): string {
  return text.replaceAll("{{Total}}", total);
}
