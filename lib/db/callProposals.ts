import { db } from "./client";
import { slugify } from "../slug";

export interface CallProposal {
  id: string;
  leadId: string;
  prospectName: string;
  callDate: string | null;
  currency: string;
  transcript: string;
  generatedHtml: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallProposalInput {
  leadId: string;
  prospectName: string;
  callDate?: string | null;
  currency: string;
  transcript: string;
  generatedHtml: string;
}

type CallProposalRow = {
  id: string;
  lead_id: string;
  prospect_name: string;
  call_date: string | null;
  currency: string;
  transcript: string;
  generated_html: string | null;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function toCallProposal(row: CallProposalRow): CallProposal {
  return {
    id: row.id,
    leadId: row.lead_id,
    prospectName: row.prospect_name,
    callDate: row.call_date,
    currency: row.currency,
    transcript: row.transcript,
    generatedHtml: row.generated_html ?? "",
    slug: row.slug,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function slugExists(slug: string): Promise<boolean> {
  const { data, error } = await db()
    .from("call_proposals")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data != null;
}

// Not reusing lib/slug.ts's ensureUniqueSlug, which is hardcoded to the
// proposals table — not worth generalising a shared util for one caller.
async function ensureUniqueCallProposalSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (await slugExists(candidate)) {
    candidate = `${base}-${n}`;
    n++;
  }
  return candidate;
}

export async function listCallProposalsForLead(leadId: string): Promise<CallProposal[]> {
  const { data, error } = await db()
    .from("call_proposals")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toCallProposal);
}

export async function getCallProposal(id: string): Promise<CallProposal> {
  const { data, error } = await db().from("call_proposals").select("*").eq("id", id).single();
  if (error) throw error;
  return toCallProposal(data);
}

export async function getCallProposalBySlug(slug: string): Promise<CallProposal | null> {
  const { data, error } = await db()
    .from("call_proposals")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toCallProposal(data) : null;
}

export async function createCallProposal(input: CallProposalInput): Promise<CallProposal> {
  const slug = await ensureUniqueCallProposalSlug(slugify(input.prospectName));

  const { data, error } = await db()
    .from("call_proposals")
    .insert({
      lead_id: input.leadId,
      prospect_name: input.prospectName,
      call_date: input.callDate ?? null,
      currency: input.currency,
      transcript: input.transcript,
      generated_html: input.generatedHtml,
      slug,
    })
    .select()
    .single();
  if (error) throw error;
  return toCallProposal(data);
}
