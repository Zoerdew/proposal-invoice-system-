import { db } from "./client";
import { kindFromDb, kindToDb, LineItemKind } from "./shared";
import type { PaymentPlan } from "../paymentPlans";

export interface Offer {
  id: string;
  name: string;
  tagline: string;
  description: string;
  contractTerms: string;
  paymentPlanOptions: PaymentPlan[];
}

export interface OfferLineItemRow {
  id: string;
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

export interface OfferInput {
  name: string;
  tagline?: string | null;
  description?: string | null;
  contractTerms?: string | null;
  paymentPlanOptions?: PaymentPlan[];
}

export interface LineItemRowInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

function toOffer(row: {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  default_contract_terms: string | null;
  payment_plan_options: string[];
}): Offer {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    contractTerms: row.default_contract_terms ?? "",
    paymentPlanOptions: (row.payment_plan_options ?? []) as PaymentPlan[],
  };
}

function toOfferLineItem(row: {
  id: string;
  description: string;
  kind: string | null;
  quantity: number;
  unit_price: number;
}): OfferLineItemRow {
  return {
    id: row.id,
    description: row.description,
    kind: kindFromDb(row.kind),
    quantity: row.quantity,
    unitPrice: row.unit_price,
  };
}

export async function listOffers(): Promise<Offer[]> {
  const { data, error } = await db().from("offers").select("*").order("name");
  if (error) throw error;
  return data.map(toOffer);
}

export async function getOffer(id: string): Promise<Offer> {
  const { data, error } = await db().from("offers").select("*").eq("id", id).single();
  if (error) throw error;
  return toOffer(data);
}

export async function getOfferForProposal(offerId: string | null): Promise<Offer | null> {
  if (!offerId) return null;
  const { data, error } = await db().from("offers").select("*").eq("id", offerId).maybeSingle();
  if (error) throw error;
  return data ? toOffer(data) : null;
}

// Empty/absent Payment Plan Options means the offer (or an ad-hoc proposal
// with no offer at all) only supports paying in full — today's original
// single-invoice behavior, preserved as the default.
export function getAvailablePaymentPlans(offer: Offer | null): PaymentPlan[] {
  const options = offer?.paymentPlanOptions;
  return options && options.length > 0 ? options : ["Pay in Full"];
}

export async function getOfferLineItems(offerId: string): Promise<OfferLineItemRow[]> {
  const { data, error } = await db()
    .from("offer_line_items")
    .select("*")
    .eq("offer_id", offerId)
    .order("created_at");
  if (error) throw error;
  return data.map(toOfferLineItem);
}

export async function createOffer(input: OfferInput): Promise<Offer> {
  const { data, error } = await db()
    .from("offers")
    .insert({
      name: input.name,
      tagline: input.tagline ?? null,
      description: input.description ?? null,
      default_contract_terms: input.contractTerms ?? null,
      payment_plan_options: input.paymentPlanOptions ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return toOffer(data);
}

export async function updateOffer(id: string, input: OfferInput): Promise<Offer> {
  const { data, error } = await db()
    .from("offers")
    .update({
      name: input.name,
      tagline: input.tagline ?? null,
      description: input.description ?? null,
      default_contract_terms: input.contractTerms ?? null,
      payment_plan_options: input.paymentPlanOptions ?? [],
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toOffer(data);
}

export async function replaceOfferLineItems(
  offerId: string,
  items: LineItemRowInput[]
): Promise<void> {
  const { error: deleteError } = await db()
    .from("offer_line_items")
    .delete()
    .eq("offer_id", offerId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("offer_line_items")
    .insert(
      items.map((item) => ({
        offer_id: offerId,
        description: item.description,
        kind: kindToDb(item.kind),
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))
    );
  if (insertError) throw insertError;
}
