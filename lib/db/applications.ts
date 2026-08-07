import { db } from "./client";
import { createProposal } from "./proposals";
import { ensureUniqueSlug, slugify } from "../slug";
import type { Database } from "./types";
import type {
  AnnualTurnover,
  ApplicationStatus,
  BudgetFit,
  DataHistory,
  DataState,
  RepeatBusiness,
  StartTiming,
  ToolUsed,
  WhatTheyreAfter,
} from "./applicationChoices";

export * from "./applicationChoices";

type ApplicationUpdatePatch = Database["public"]["Tables"]["applications"]["Update"];

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  businessName: string;
  website: string;
  whatBusinessDoes: string;
  timeInBusiness: string;
  annualTurnover: AnnualTurnover | null;
  mainOffersPricing: string;
  topRevenueOffer: string;
  repeatBusiness: RepeatBusiness | null;
  toolsUsed: ToolUsed[];
  dataHistory: DataHistory | null;
  dataState: DataState | null;
  whatTheyveTried: string;
  biggestOpportunity: string;
  slowWeekBehaviour: string;
  whyNow: string;
  whatTheyreAfter: WhatTheyreAfter | null;
  opennessToEvidence: string;
  startTiming: StartTiming | null;
  budgetFit: BudgetFit | null;
  anythingElse: string;
  status: ApplicationStatus;
  fitNotesPrivate: string;
  submittedAt: string | null;
}

// Everything the public /apply form collects. fitNotesPrivate and status
// are admin-only — never accepted from a public submission.
export interface ApplicationInput {
  applicantName: string;
  email: string;
  businessName?: string;
  website?: string;
  whatBusinessDoes?: string;
  timeInBusiness?: string;
  annualTurnover?: AnnualTurnover;
  mainOffersPricing?: string;
  topRevenueOffer?: string;
  repeatBusiness?: RepeatBusiness;
  toolsUsed?: ToolUsed[];
  dataHistory?: DataHistory;
  dataState?: DataState;
  whatTheyveTried?: string;
  biggestOpportunity?: string;
  slowWeekBehaviour?: string;
  whyNow?: string;
  whatTheyreAfter?: WhatTheyreAfter;
  opennessToEvidence?: string;
  startTiming?: StartTiming;
  budgetFit?: BudgetFit;
  anythingElse?: string;
}

type ApplicationRow = {
  id: string;
  applicant_name: string;
  email: string | null;
  business_name: string | null;
  website: string | null;
  what_business_does: string | null;
  time_in_business: string | null;
  annual_turnover: string | null;
  main_offers_pricing: string | null;
  top_revenue_offer: string | null;
  repeat_business: string | null;
  tools_used: string[];
  data_history: string | null;
  data_state: string | null;
  what_theyve_tried: string | null;
  biggest_opportunity: string | null;
  slow_week_behaviour: string | null;
  why_now: string | null;
  what_theyre_after: string | null;
  openness_to_evidence: string | null;
  start_timing: string | null;
  budget_fit: string | null;
  anything_else: string | null;
  status: string | null;
  fit_notes_private: string | null;
  submitted_at: string | null;
};

function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    applicantName: row.applicant_name,
    email: row.email ?? "",
    businessName: row.business_name ?? "",
    website: row.website ?? "",
    whatBusinessDoes: row.what_business_does ?? "",
    timeInBusiness: row.time_in_business ?? "",
    annualTurnover: row.annual_turnover as AnnualTurnover | null,
    mainOffersPricing: row.main_offers_pricing ?? "",
    topRevenueOffer: row.top_revenue_offer ?? "",
    repeatBusiness: row.repeat_business as RepeatBusiness | null,
    toolsUsed: (row.tools_used ?? []) as ToolUsed[],
    dataHistory: row.data_history as DataHistory | null,
    dataState: row.data_state as DataState | null,
    whatTheyveTried: row.what_theyve_tried ?? "",
    biggestOpportunity: row.biggest_opportunity ?? "",
    slowWeekBehaviour: row.slow_week_behaviour ?? "",
    whyNow: row.why_now ?? "",
    whatTheyreAfter: row.what_theyre_after as WhatTheyreAfter | null,
    opennessToEvidence: row.openness_to_evidence ?? "",
    startTiming: row.start_timing as StartTiming | null,
    budgetFit: row.budget_fit as BudgetFit | null,
    anythingElse: row.anything_else ?? "",
    status: (row.status as ApplicationStatus) ?? "New",
    fitNotesPrivate: row.fit_notes_private ?? "",
    submittedAt: row.submitted_at,
  };
}

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await db()
    .from("applications")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data.map(toApplication);
}

export async function getApplication(id: string): Promise<Application> {
  const { data, error } = await db().from("applications").select("*").eq("id", id).single();
  if (error) throw error;
  return toApplication(data);
}

export async function createApplication(input: ApplicationInput): Promise<Application> {
  const { data, error } = await db()
    .from("applications")
    .insert({
      applicant_name: input.applicantName,
      email: input.email,
      business_name: input.businessName ?? null,
      website: input.website ?? null,
      what_business_does: input.whatBusinessDoes ?? null,
      time_in_business: input.timeInBusiness ?? null,
      annual_turnover: input.annualTurnover ?? null,
      main_offers_pricing: input.mainOffersPricing ?? null,
      top_revenue_offer: input.topRevenueOffer ?? null,
      repeat_business: input.repeatBusiness ?? null,
      tools_used: input.toolsUsed ?? [],
      data_history: input.dataHistory ?? null,
      data_state: input.dataState ?? null,
      what_theyve_tried: input.whatTheyveTried ?? null,
      biggest_opportunity: input.biggestOpportunity ?? null,
      slow_week_behaviour: input.slowWeekBehaviour ?? null,
      why_now: input.whyNow ?? null,
      what_theyre_after: input.whatTheyreAfter ?? null,
      openness_to_evidence: input.opennessToEvidence ?? null,
      start_timing: input.startTiming ?? null,
      budget_fit: input.budgetFit ?? null,
      anything_else: input.anythingElse ?? null,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return toApplication(data);
}

// Creates a draft proposal pre-filled from the application (Phase 6, per
// BUILD-SPEC.md's /admin/applications "convert to proposal"). Leaves offer,
// line items, and contract terms for the admin to fill in via the normal
// proposal builder — this only saves re-typing the applicant's contact info.
export async function convertApplicationToProposal(applicationId: string): Promise<{ proposalId: string }> {
  const application = await getApplication(applicationId);
  const slug = await ensureUniqueSlug(slugify(application.applicantName));

  const proposal = await createProposal({
    clientName: application.applicantName,
    clientEmail: application.email,
    company: application.businessName || null,
    slug,
  });

  const { error } = await db()
    .from("proposals")
    .update({ application_id: applicationId })
    .eq("id", proposal.id);
  if (error) throw error;

  return { proposalId: proposal.id };
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  fitNotesPrivate?: string
): Promise<Application> {
  const patch: ApplicationUpdatePatch = { status };
  if (fitNotesPrivate !== undefined) patch.fit_notes_private = fitNotesPrivate;

  const { data, error } = await db()
    .from("applications")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toApplication(data);
}
