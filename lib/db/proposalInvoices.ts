import { db } from "./client";

export interface ProposalInvoice {
  id: string;
  proposalId: string;
  sequence: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
  xeroInvoiceId: string | null;
  xeroOnlineInvoiceUrl: string | null;
}

export interface ProposalInvoiceInput {
  proposalId: string;
  sequence: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
}

type ProposalInvoiceRow = {
  id: string;
  proposal_id: string;
  sequence: number;
  amount: number;
  due_date: string;
  description: string | null;
  xero_invoice_id: string | null;
  xero_online_invoice_url: string | null;
};

function toProposalInvoice(row: ProposalInvoiceRow): ProposalInvoice {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    sequence: row.sequence,
    amount: row.amount,
    dueDate: row.due_date.slice(0, 10),
    description: row.description ?? "",
    xeroInvoiceId: row.xero_invoice_id,
    xeroOnlineInvoiceUrl: row.xero_online_invoice_url,
  };
}

export async function getProposalInvoices(proposalId: string): Promise<ProposalInvoice[]> {
  const { data, error } = await db()
    .from("proposal_invoices")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("sequence");
  if (error) throw error;
  return data.map(toProposalInvoice);
}

export async function createProposalInvoice(
  input: ProposalInvoiceInput
): Promise<ProposalInvoice> {
  const { data, error } = await db()
    .from("proposal_invoices")
    .insert({
      proposal_id: input.proposalId,
      sequence: input.sequence,
      amount: input.amount,
      due_date: input.dueDate,
      description: input.description,
    })
    .select()
    .single();
  if (error) throw error;
  return toProposalInvoice(data);
}

export async function updateProposalInvoiceXero(
  id: string,
  xero: { xeroInvoiceId: string; xeroOnlineInvoiceUrl: string }
): Promise<void> {
  const { error } = await db()
    .from("proposal_invoices")
    .update({
      xero_invoice_id: xero.xeroInvoiceId,
      xero_online_invoice_url: xero.xeroOnlineInvoiceUrl,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProposalInvoicesForProposal(proposalId: string): Promise<void> {
  const { error } = await db().from("proposal_invoices").delete().eq("proposal_id", proposalId);
  if (error) throw error;
}

// Instalments waiting for their Xero invoice to actually be created — see
// the cron job for why creation itself (not just sending) is deferred.
export async function listPendingInvoices(): Promise<ProposalInvoice[]> {
  const { data, error } = await db()
    .from("proposal_invoices")
    .select("*")
    .is("xero_invoice_id", null);
  if (error) throw error;
  return data.map(toProposalInvoice);
}
