import { db } from "./client";
import { ProposalStatus, statusFromDb, statusToDb } from "./shared";
import type { PaymentPlan } from "../paymentPlans";
import type { Database } from "./types";

type ProposalUpdatePatch = Database["public"]["Tables"]["proposals"]["Update"];

export interface Proposal {
  id: string;
  clientName: string;
  clientEmail: string;
  company: string;
  offerId: string | null;
  status: ProposalStatus;
  slug: string;
  contractTerms: string;
  dateSent: string | null;
  dateSigned: string | null;
  paymentPlan: PaymentPlan | null;
  depositAmount: number | null;
  notes: string;
  proposalLink: string;
}

export interface ProposalInput {
  clientName?: string;
  clientEmail?: string | null;
  company?: string | null;
  offerId?: string | null;
  contractTerms?: string | null;
  depositAmount?: number | null;
}

type ProposalRow = {
  id: string;
  client_name: string;
  client_email: string;
  company: string | null;
  offer_id: string | null;
  status: string;
  slug: string;
  contract_terms: string | null;
  date_sent: string | null;
  date_signed: string | null;
  payment_plan: string | null;
  deposit_amount: number | null;
  notes: string | null;
};

function toProposal(row: ProposalRow): Proposal {
  return {
    id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    company: row.company ?? "",
    offerId: row.offer_id,
    status: statusFromDb(row.status),
    slug: row.slug,
    contractTerms: row.contract_terms ?? "",
    dateSent: row.date_sent,
    dateSigned: row.date_signed,
    paymentPlan: (row.payment_plan as PaymentPlan) ?? null,
    depositAmount: row.deposit_amount,
    notes: row.notes ?? "",
    proposalLink: `/proposal/${row.slug}`,
  };
}

export async function listProposals(): Promise<Proposal[]> {
  const { data, error } = await db()
    .from("proposals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(toProposal);
}

export async function getProposal(id: string): Promise<Proposal> {
  const { data, error } = await db().from("proposals").select("*").eq("id", id).single();
  if (error) throw error;
  return toProposal(data);
}

export async function getProposalBySlug(slug: string): Promise<Proposal | null> {
  const { data, error } = await db().from("proposals").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toProposal(data) : null;
}

export async function createProposal(
  input: ProposalInput & { clientName: string; slug: string }
): Promise<Proposal> {
  const { data, error } = await db()
    .from("proposals")
    .insert({
      client_name: input.clientName,
      client_email: input.clientEmail ?? "",
      company: input.company ?? null,
      offer_id: input.offerId ?? null,
      contract_terms: input.contractTerms ?? null,
      deposit_amount: input.depositAmount ?? null,
      slug: input.slug,
      status: statusToDb("Draft"),
    })
    .select()
    .single();
  if (error) throw error;
  return toProposal(data);
}

export interface ProposalUpdate extends ProposalInput {
  status?: ProposalStatus;
  dateSent?: string | null;
  dateSigned?: string | null;
  paymentPlan?: PaymentPlan | null;
}

export async function updateProposal(id: string, input: ProposalUpdate): Promise<Proposal> {
  const patch: ProposalUpdatePatch = {};
  if (input.clientName !== undefined) patch.client_name = input.clientName;
  if (input.clientEmail !== undefined) patch.client_email = input.clientEmail ?? "";
  if (input.company !== undefined) patch.company = input.company;
  if (input.offerId !== undefined) patch.offer_id = input.offerId;
  if (input.contractTerms !== undefined) patch.contract_terms = input.contractTerms;
  if (input.depositAmount !== undefined) patch.deposit_amount = input.depositAmount;
  if (input.status !== undefined) patch.status = statusToDb(input.status);
  if (input.dateSent !== undefined) patch.date_sent = input.dateSent;
  if (input.dateSigned !== undefined) patch.date_signed = input.dateSigned;
  if (input.paymentPlan !== undefined) patch.payment_plan = input.paymentPlan;

  const { data, error } = await db()
    .from("proposals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toProposal(data);
}
