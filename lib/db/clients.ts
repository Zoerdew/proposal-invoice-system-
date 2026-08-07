import { randomBytes } from "crypto";
import { db } from "./client";
import type { PaymentPlan } from "../paymentPlans";

export interface Client {
  id: string;
  name: string;
  portalToken: string;
  programmeStartDate: string | null;
  targetFigure: number;
  totalIdentified: number;
  totalBanked: number;
  onboardingComplete: boolean;
  businessName: string;
  bestEmail: string;
}

// First word / rest split — a heuristic, not a real first/last name input.
// Correctable later in admin (Phase 6) once that exists.
export function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIndex), lastName: trimmed.slice(spaceIndex + 1) };
}

export interface CreateClientFromProposalInput {
  proposalId: string;
  clientName: string;
  clientEmail: string;
  businessName?: string | null;
  packagePrice: number;
  paymentPlan?: PaymentPlan | null;
}

export interface ClientWithContact extends Client {
  email: string;
  firstName: string;
}

function toClientWithContact(row: {
  id: string;
  name: string;
  portal_token: string;
  business_name: string | null;
  email: string | null;
  first_name: string | null;
}): ClientWithContact {
  return {
    id: row.id,
    name: row.name,
    portalToken: row.portal_token,
    programmeStartDate: null,
    targetFigure: 0,
    totalIdentified: 0,
    totalBanked: 0,
    onboardingComplete: false,
    businessName: row.business_name ?? "",
    bestEmail: row.email ?? "",
    email: row.email ?? "",
    firstName: row.first_name ?? splitFullName(row.name).firstName,
  };
}

// One client per proposal — checked first so a retry (after e.g. the email
// failed the first time) never creates a duplicate.
export async function getClientByProposalId(proposalId: string): Promise<ClientWithContact | null> {
  const { data, error } = await db()
    .from("clients")
    .select("*")
    .eq("proposal_id", proposalId)
    .maybeSingle();
  if (error) throw error;
  return data ? toClientWithContact(data) : null;
}

export async function createClientFromProposal(
  input: CreateClientFromProposalInput
): Promise<ClientWithContact> {
  const { firstName, lastName } = splitFullName(input.clientName);
  const portalToken = randomBytes(16).toString("hex");

  const { data, error } = await db()
    .from("clients")
    .insert({
      name: input.clientName,
      first_name: firstName,
      last_name: lastName,
      email: input.clientEmail,
      business_name: input.businessName ?? null,
      package_price: input.packagePrice,
      payment_plan: input.paymentPlan ?? null,
      portal_token: portalToken,
      proposal_id: input.proposalId,
      status: "Active",
    })
    .select()
    .single();
  if (error) throw error;
  return toClientWithContact(data);
}

export type CheckinDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
export type RevenueDataSource = "Stripe" | "Other platform" | "They'll send me reports";

export interface OnboardingData {
  bestDayForCheckin: CheckinDay;
  whereRevenueDataLives: RevenueDataSource;
  programmeStartDate: string;
  baselineMonthlyRevenue: number;
  annualTurnover: number;
  biggestChallengeRightNow: string;
  whatsGeneratingLeadsNow: string;
  sixMonthRisk: string;
  whyNow: string;
  definitionOfSuccess?: string;
  anythingElse?: string;
}

// Findings has no stored "identified/banked" total — every row is itself an
// identified item, and totalBanked is the subset actually realized. Computed
// live rather than stored, so it can never drift from the findings table.
async function getFindingsTotals(clientId: string): Promise<{ identified: number; banked: number }> {
  const { data, error } = await db()
    .from("findings")
    .select("value, status")
    .eq("client_id", clientId);
  if (error) throw error;

  let identified = 0;
  let banked = 0;
  for (const row of data) {
    const value = row.value ?? 0;
    identified += value;
    if (row.status === "Banked") banked += value;
  }
  return { identified, banked };
}

export async function getClientByToken(token: string): Promise<Client | null> {
  if (!token) return null;

  const { data, error } = await db()
    .from("clients")
    .select("*")
    .eq("portal_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { identified, banked } = await getFindingsTotals(data.id);

  return {
    id: data.id,
    name: data.name,
    portalToken: data.portal_token,
    programmeStartDate: data.start_date,
    targetFigure: data.target_figure ?? 50000,
    totalIdentified: identified,
    totalBanked: banked,
    onboardingComplete: data.onboarding_complete,
    businessName: data.business_name ?? "",
    // The old Airtable schema had a separate "Best Email" field on Clients,
    // confirmed (not collected) on the onboarding page before the form
    // proper. BUILD-SPEC.md's clients table only lists one `email` column —
    // treating them as the same field, since nothing flagged a deliberate
    // split.
    bestEmail: data.email ?? "",
  };
}

// Writes span two tables: start_date/baseline figures/onboarding_complete
// belong on clients (the working record); the qualitative answers belong on
// onboarding (kept separate so the intake record and working record don't
// fight, per BUILD-SPEC.md). Upserts onboarding since this is the first
// write to that table for a given client.
export async function updateClientOnboarding(clientId: string, data: OnboardingData): Promise<void> {
  const { error: clientError } = await db()
    .from("clients")
    .update({
      start_date: data.programmeStartDate,
      baseline_monthly_revenue: data.baselineMonthlyRevenue,
      annual_turnover: data.annualTurnover,
      onboarding_complete: true,
    })
    .eq("id", clientId);
  if (clientError) throw clientError;

  const { error: onboardingError } = await db().from("onboarding").upsert(
    {
      client_id: clientId,
      best_day_for_checkin: data.bestDayForCheckin,
      where_revenue_data_lives: data.whereRevenueDataLives,
      biggest_challenge_right_now: data.biggestChallengeRightNow,
      whats_generating_leads_now: data.whatsGeneratingLeadsNow,
      six_month_risk: data.sixMonthRisk,
      why_now: data.whyNow,
      ...(data.definitionOfSuccess ? { definition_of_success: data.definitionOfSuccess } : {}),
      ...(data.anythingElse ? { anything_else: data.anythingElse } : {}),
    },
    { onConflict: "client_id" }
  );
  if (onboardingError) throw onboardingError;
}
