import { randomBytes } from "crypto";
import { db } from "./client";
import type { Database } from "./types";
import type { PaymentPlan } from "../paymentPlans";
import type { CheckinDay, ClientStatus, RevenueDataSource } from "./clientChoices";

export type { CheckinDay, ClientStatus, RevenueDataSource } from "./clientChoices";

type ClientUpdatePatch = Database["public"]["Tables"]["clients"]["Update"];

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
      // Real choice set is Onboarding/Active/Wrapping up/Complete/Paused —
      // a freshly-signed client hasn't done onboarding yet.
      status: "Onboarding",
    })
    .select()
    .single();
  if (error) throw error;
  return toClientWithContact(data);
}

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

export interface OnboardingResponses {
  bestDayForCheckin: string;
  whereRevenueDataLives: string;
  biggestChallengeRightNow: string;
  whatsGeneratingLeadsNow: string;
  sixMonthRisk: string;
  whyNow: string;
  definitionOfSuccess: string;
  anythingElse: string;
}

export async function getOnboardingByClientId(clientId: string): Promise<OnboardingResponses | null> {
  const { data, error } = await db()
    .from("onboarding")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    bestDayForCheckin: data.best_day_for_checkin ?? "",
    whereRevenueDataLives: data.where_revenue_data_lives ?? "",
    biggestChallengeRightNow: data.biggest_challenge_right_now ?? "",
    whatsGeneratingLeadsNow: data.whats_generating_leads_now ?? "",
    sixMonthRisk: data.six_month_risk ?? "",
    whyNow: data.why_now ?? "",
    definitionOfSuccess: data.definition_of_success ?? "",
    anythingElse: data.anything_else ?? "",
  };
}

// The full admin-facing record — every field Zoë can edit directly,
// distinct from the stripped-down portal Client type above.
export interface AdminClient {
  id: string;
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
  portalToken: string;
  targetFigure: number | null;
  baselineMonthlyRevenue: number | null;
  baselineRepeatBuyerPct: number | null;
  annualTurnover: number | null;
  baselineDate: string | null;
  onboardingComplete: boolean;
  proposalId: string | null;
}

type AdminClientRow = {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  business_name: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  package_price: number | null;
  payment_plan: string | null;
  commercial_objectives: string | null;
  notes: string | null;
  portal_token: string;
  target_figure: number | null;
  baseline_monthly_revenue: number | null;
  baseline_repeat_buyer_pct: number | null;
  annual_turnover: number | null;
  baseline_date: string | null;
  onboarding_complete: boolean;
  proposal_id: string | null;
};

function toAdminClient(row: AdminClientRow): AdminClient {
  return {
    id: row.id,
    name: row.name,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    businessName: row.business_name ?? "",
    status: row.status as ClientStatus | null,
    startDate: row.start_date,
    endDate: row.end_date,
    packagePrice: row.package_price,
    paymentPlan: row.payment_plan as PaymentPlan | null,
    commercialObjectives: row.commercial_objectives ?? "",
    notes: row.notes ?? "",
    portalToken: row.portal_token,
    targetFigure: row.target_figure,
    baselineMonthlyRevenue: row.baseline_monthly_revenue,
    baselineRepeatBuyerPct: row.baseline_repeat_buyer_pct,
    annualTurnover: row.annual_turnover,
    baselineDate: row.baseline_date,
    onboardingComplete: row.onboarding_complete,
    proposalId: row.proposal_id,
  };
}

export async function listClientsAdmin(): Promise<AdminClient[]> {
  const { data, error } = await db()
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toAdminClient);
}

export async function getClientAdmin(id: string): Promise<AdminClient> {
  const { data, error } = await db().from("clients").select("*").eq("id", id).single();
  if (error) throw error;
  return toAdminClient(data);
}

export interface AdminClientInput {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  businessName?: string | null;
  status?: ClientStatus | null;
  startDate?: string | null;
  endDate?: string | null;
  packagePrice?: number | null;
  paymentPlan?: PaymentPlan | null;
  commercialObjectives?: string | null;
  notes?: string | null;
  targetFigure?: number | null;
  baselineMonthlyRevenue?: number | null;
  baselineRepeatBuyerPct?: number | null;
  annualTurnover?: number | null;
  baselineDate?: string | null;
}

export async function updateClientAdmin(id: string, input: AdminClientInput): Promise<AdminClient> {
  const patch: ClientUpdatePatch = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.email !== undefined) patch.email = input.email;
  if (input.businessName !== undefined) patch.business_name = input.businessName;
  if (input.status !== undefined) patch.status = input.status;
  if (input.startDate !== undefined) patch.start_date = input.startDate;
  if (input.endDate !== undefined) patch.end_date = input.endDate;
  if (input.packagePrice !== undefined) patch.package_price = input.packagePrice;
  if (input.paymentPlan !== undefined) patch.payment_plan = input.paymentPlan;
  if (input.commercialObjectives !== undefined) patch.commercial_objectives = input.commercialObjectives;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.targetFigure !== undefined) patch.target_figure = input.targetFigure;
  if (input.baselineMonthlyRevenue !== undefined) patch.baseline_monthly_revenue = input.baselineMonthlyRevenue;
  if (input.baselineRepeatBuyerPct !== undefined) patch.baseline_repeat_buyer_pct = input.baselineRepeatBuyerPct;
  if (input.annualTurnover !== undefined) patch.annual_turnover = input.annualTurnover;
  if (input.baselineDate !== undefined) patch.baseline_date = input.baselineDate;

  const { data, error } = await db().from("clients").update(patch).eq("id", id).select().single();
  if (error) throw error;
  return toAdminClient(data);
}
