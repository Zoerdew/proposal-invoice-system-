import { PaymentPlan } from "./paymentPlans";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

// Table IDs are stable and not secret, so they're hardcoded rather than env vars.
export const TABLES = {
  offers: "tblhqjEJYMgmpsol0",
  offerLineItems: "tblVOTyI7jAMvjIPZ",
  proposals: "tblkqE0P1K6rDodUQ",
  lineItems: "tbleh2zwfCFrfdaNG",
  signatures: "tblHvwLW4grPPOnY8",
  xeroConnection: "tblhHA3S9pz3L8Mrx",
  proposalInvoices: "tblYZpG1VyF3FXo0j",
} as const;

export type ProposalStatus =
  | "Draft"
  | "Sent"
  | "Viewed"
  | "Signed"
  | "Invoiced"
  | "Paid";

export interface AirtableRecord<T> {
  id: string;
  createdTime: string;
  fields: T;
}

export interface ProposalFields {
  "Client Name"?: string;
  "Client Email"?: string;
  Company?: string;
  Offer?: string[];
  Status?: ProposalStatus;
  "Proposal Page Slug"?: string;
  "Contract Terms"?: string;
  "Date Sent"?: string;
  "Date Signed"?: string;
  "Xero Invoice ID"?: string;
  "Xero Online Invoice URL"?: string;
  Notes?: string;
  "Line Items"?: string[];
  Signatures?: string[];
  Total?: number;
  "Proposal Link"?: string;
  "Payment Plan"?: PaymentPlan;
  "Proposal Invoices"?: string[];
  "Deposit Amount"?: number;
}

export type LineItemKind = "Fixed" | "Package Option" | "Add-on";

export interface LineItemFields {
  Description?: string;
  Proposal?: string[];
  Quantity?: number;
  "Unit Price"?: number;
  "Line Total"?: number;
  Kind?: LineItemKind;
  Selected?: boolean;
}

export interface SignatureFields {
  "Signed Name"?: string;
  Proposal?: string[];
  "Signed At"?: string;
  "IP Address"?: string;
  Confirmed?: boolean;
}

export interface OfferFields {
  "Offer Name"?: string;
  "Default Contract Terms"?: string;
  Proposals?: string[];
  "Offer Line Items"?: string[];
  Tagline?: string;
  Description?: string;
  "Payment Plan Options"?: PaymentPlan[];
}

export interface ProposalInvoiceFields {
  Sequence?: number;
  Proposal?: string[];
  Description?: string;
  Amount?: number;
  "Due Date"?: string;
  "Xero Invoice ID"?: string;
  "Xero Online Invoice URL"?: string;
}

export interface OfferLineItemFields {
  Description?: string;
  Offer?: string[];
  Kind?: LineItemKind;
  Quantity?: number;
  "Unit Price"?: number;
}

export interface XeroConnectionFields {
  Label?: string;
  "Tenant ID"?: string;
  "Access Token"?: string;
  "Refresh Token"?: string;
  "Expires At"?: string;
}

function airtableHeaders() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) throw new Error("AIRTABLE_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function baseId() {
  const id = process.env.AIRTABLE_BASE_ID;
  if (!id) throw new Error("AIRTABLE_BASE_ID is not set");
  return id;
}

async function airtableRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${AIRTABLE_API_URL}/${baseId()}/${path}`, {
    ...init,
    headers: { ...airtableHeaders(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status} on ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getRecord<T>(
  tableId: string,
  recordId: string
): Promise<AirtableRecord<T>> {
  return airtableRequest<AirtableRecord<T>>(`${tableId}/${recordId}`);
}

export async function getRecordsByIds<T>(
  tableId: string,
  ids: string[]
): Promise<AirtableRecord<T>[]> {
  if (ids.length === 0) return [];
  return Promise.all(ids.map((id) => getRecord<T>(tableId, id)));
}

export async function findOneByFormula<T>(
  tableId: string,
  formula: string
): Promise<AirtableRecord<T> | null> {
  const qs = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  });
  const data = await airtableRequest<{ records: AirtableRecord<T>[] }>(
    `${tableId}?${qs.toString()}`
  );
  return data.records[0] ?? null;
}

export async function listAll<T>(
  tableId: string,
  formula?: string
): Promise<AirtableRecord<T>[]> {
  const qs = new URLSearchParams();
  if (formula) qs.set("filterByFormula", formula);
  const data = await airtableRequest<{ records: AirtableRecord<T>[] }>(
    `${tableId}${qs.toString() ? `?${qs.toString()}` : ""}`
  );
  return data.records;
}

export async function createRecord<T>(
  tableId: string,
  fields: T
): Promise<AirtableRecord<T>> {
  return airtableRequest<AirtableRecord<T>>(tableId, {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
}

export async function updateRecord<T>(
  tableId: string,
  recordId: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  return airtableRequest<AirtableRecord<T>>(`${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

export async function deleteRecord(tableId: string, recordId: string): Promise<void> {
  await airtableRequest(`${tableId}/${recordId}`, { method: "DELETE" });
}

export async function deleteRecords(tableId: string, recordIds: string[]): Promise<void> {
  await Promise.all(recordIds.map((id) => deleteRecord(tableId, id)));
}

function escapeFormulaString(value: string): string {
  return value.replace(/'/g, "\\'");
}

export async function getProposalBySlug(
  slug: string
): Promise<AirtableRecord<ProposalFields> | null> {
  return findOneByFormula<ProposalFields>(
    TABLES.proposals,
    `{Proposal Page Slug} = '${escapeFormulaString(slug)}'`
  );
}

export async function getLineItemsForProposal(
  proposal: AirtableRecord<ProposalFields>
): Promise<AirtableRecord<LineItemFields>[]> {
  const ids = proposal.fields["Line Items"] ?? [];
  return getRecordsByIds<LineItemFields>(TABLES.lineItems, ids);
}

// Fixed items are always included; Package Option/Add-on items only once the
// client has locked in their choice on page 1. Blank Kind defaults to Fixed
// so line items created before this field existed keep working unchanged.
export function getIncludedLineItems(
  lineItems: AirtableRecord<LineItemFields>[]
): AirtableRecord<LineItemFields>[] {
  return lineItems.filter(
    (item) => (item.fields.Kind ?? "Fixed") === "Fixed" || item.fields.Selected
  );
}

export function computeTotal(lineItems: AirtableRecord<LineItemFields>[]): number {
  return lineItems.reduce((sum, item) => sum + (item.fields["Line Total"] ?? 0), 0);
}

export async function listOffers(): Promise<AirtableRecord<OfferFields>[]> {
  return listAll<OfferFields>(TABLES.offers);
}

export async function getOffer(id: string): Promise<AirtableRecord<OfferFields>> {
  return getRecord<OfferFields>(TABLES.offers, id);
}

export async function getOfferLineItems(
  offer: AirtableRecord<OfferFields>
): Promise<AirtableRecord<OfferLineItemFields>[]> {
  const ids = offer.fields["Offer Line Items"] ?? [];
  return getRecordsByIds<OfferLineItemFields>(TABLES.offerLineItems, ids);
}

export async function listProposals(): Promise<AirtableRecord<ProposalFields>[]> {
  return listAll<ProposalFields>(TABLES.proposals);
}

export async function getOfferForProposal(
  proposal: AirtableRecord<ProposalFields>
): Promise<AirtableRecord<OfferFields> | null> {
  const offerId = proposal.fields.Offer?.[0];
  if (!offerId) return null;
  return getOffer(offerId);
}

// Empty/absent Payment Plan Options means the offer (or an ad-hoc proposal
// with no offer at all) only supports paying in full — today's original
// single-invoice behavior, preserved as the default.
export function getAvailablePaymentPlans(
  offer: AirtableRecord<OfferFields> | null
): PaymentPlan[] {
  const options = offer?.fields["Payment Plan Options"];
  return options && options.length > 0 ? options : ["Pay in Full"];
}

export async function getProposalInvoices(
  proposal: AirtableRecord<ProposalFields>
): Promise<AirtableRecord<ProposalInvoiceFields>[]> {
  const ids = proposal.fields["Proposal Invoices"] ?? [];
  const invoices = await getRecordsByIds<ProposalInvoiceFields>(TABLES.proposalInvoices, ids);
  return invoices.sort((a, b) => (a.fields.Sequence ?? 0) - (b.fields.Sequence ?? 0));
}
