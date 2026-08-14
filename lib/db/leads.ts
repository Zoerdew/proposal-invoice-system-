import { db } from "./client";
import { createProposal } from "./proposals";
import { ensureUniqueSlug, slugify } from "../slug";
import type { LeadStage } from "./leadChoices";

export * from "./leadChoices";

export interface Lead {
  id: string;
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
  applicationId: string | null;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadInput {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  productId?: string | null;
  leadStage?: LeadStage;
  leadValue?: number | null;
  conversionProbability?: number | null;
  notes?: string | null;
  firstContactDate?: string | null;
  closeDate?: string | null;
  daysUntilNextContact?: number | null;
  applicationId?: string | null;
}

export interface LeadFilters {
  stage?: LeadStage;
  productId?: string;
}

export interface LeadAttachment {
  id: string;
  leadId: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
}

type LeadRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  product_id: string | null;
  lead_stage: string;
  lead_value: number | null;
  conversion_probability: number | null;
  notes: string | null;
  first_contact_date: string | null;
  close_date: string | null;
  days_until_next_contact: number | null;
  application_id: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    source: row.source ?? "",
    productId: row.product_id,
    leadStage: (row.lead_stage as LeadStage) ?? "New",
    leadValue: row.lead_value,
    conversionProbability: row.conversion_probability,
    notes: row.notes ?? "",
    firstContactDate: row.first_contact_date,
    closeDate: row.close_date,
    daysUntilNextContact: row.days_until_next_contact,
    applicationId: row.application_id,
    clientId: row.client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toLeadAttachment(row: {
  id: string;
  lead_id: string;
  file_url: string;
  file_name: string | null;
  created_at: string;
}): LeadAttachment {
  return {
    id: row.id,
    leadId: row.lead_id,
    fileUrl: row.file_url,
    fileName: row.file_name ?? "",
    createdAt: row.created_at,
  };
}

export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  let query = db().from("leads").select("*").order("created_at", { ascending: false });
  if (filters.stage) query = query.eq("lead_stage", filters.stage);
  if (filters.productId) query = query.eq("product_id", filters.productId);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(toLead);
}

export async function getLead(id: string): Promise<Lead> {
  const { data, error } = await db().from("leads").select("*").eq("id", id).single();
  if (error) throw error;
  return toLead(data);
}

// Attachments cascade; a linked proposal (proposals.lead_id) has no ON
// DELETE clause, so Postgres rejects the delete rather than orphaning it —
// the caller is expected to surface that as "this lead has a proposal."
export async function deleteLead(id: string): Promise<void> {
  const { error } = await db().from("leads").delete().eq("id", id);
  if (error) throw error;
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { data, error } = await db()
    .from("leads")
    .insert({
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source ?? null,
      product_id: input.productId ?? null,
      lead_stage: input.leadStage ?? "New",
      lead_value: input.leadValue ?? null,
      conversion_probability: input.conversionProbability ?? null,
      notes: input.notes ?? null,
      first_contact_date: input.firstContactDate ?? null,
      close_date: input.closeDate ?? null,
      days_until_next_contact: input.daysUntilNextContact ?? null,
      application_id: input.applicationId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toLead(data);
}

// Partial update, unlike updateLead below which overwrites every field —
// safe to call from places (like the proposal sign flow) that only know
// about the stage and shouldn't clobber everything else on the lead.
export async function setLeadStage(id: string, stage: LeadStage): Promise<void> {
  const { error } = await db().from("leads").update({ lead_stage: stage }).eq("id", id);
  if (error) throw error;
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  const { data, error } = await db()
    .from("leads")
    .update({
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      source: input.source ?? null,
      product_id: input.productId ?? null,
      lead_stage: input.leadStage ?? "New",
      lead_value: input.leadValue ?? null,
      conversion_probability: input.conversionProbability ?? null,
      notes: input.notes ?? null,
      first_contact_date: input.firstContactDate ?? null,
      close_date: input.closeDate ?? null,
      days_until_next_contact: input.daysUntilNextContact ?? null,
      application_id: input.applicationId ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toLead(data);
}

// Same shape as convertApplicationToProposal (lib/db/applications.ts): a
// minimal pre-filled proposal, leaving offer/line items/contract terms for
// the admin to fill in via the normal proposal builder. Sets proposals.lead_id
// as the back-reference, mirroring proposals.application_id.
export async function convertLeadToProposal(leadId: string): Promise<{ proposalId: string }> {
  const lead = await getLead(leadId);
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const slug = await ensureUniqueSlug(slugify(fullName));

  const proposal = await createProposal({
    clientName: fullName || lead.email || "Unnamed lead",
    clientEmail: lead.email,
    company: null,
    slug,
  });

  const { error } = await db()
    .from("proposals")
    .update({ lead_id: leadId })
    .eq("id", proposal.id);
  if (error) throw error;

  return { proposalId: proposal.id };
}

export async function listLeadAttachments(leadId: string): Promise<LeadAttachment[]> {
  const { data, error } = await db()
    .from("lead_attachments")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toLeadAttachment);
}

export async function createLeadAttachment(
  leadId: string,
  input: { fileUrl: string; fileName?: string | null }
): Promise<LeadAttachment> {
  const { data, error } = await db()
    .from("lead_attachments")
    .insert({
      lead_id: leadId,
      file_url: input.fileUrl,
      file_name: input.fileName ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toLeadAttachment(data);
}
