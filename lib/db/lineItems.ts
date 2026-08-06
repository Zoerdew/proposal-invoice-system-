import { db } from "./client";
import { kindFromDb, kindToDb, LineItemKind } from "./shared";

export interface LineItem {
  id: string;
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  selected: boolean;
}

export interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

function toLineItem(row: {
  id: string;
  description: string;
  kind: string | null;
  quantity: number;
  unit_price: number;
  line_total: number | null;
  selected: boolean;
}): LineItem {
  return {
    id: row.id,
    description: row.description,
    kind: kindFromDb(row.kind),
    quantity: row.quantity,
    unitPrice: row.unit_price,
    lineTotal: row.line_total ?? 0,
    selected: row.selected,
  };
}

export async function getLineItemsForProposal(proposalId: string): Promise<LineItem[]> {
  const { data, error } = await db()
    .from("line_items")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at");
  if (error) throw error;
  return data.map(toLineItem);
}

export async function replaceLineItems(
  proposalId: string,
  items: LineItemInput[]
): Promise<void> {
  const { error: deleteError } = await db()
    .from("line_items")
    .delete()
    .eq("proposal_id", proposalId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("line_items")
    .insert(
      items.map((item) => ({
        proposal_id: proposalId,
        description: item.description,
        kind: kindToDb(item.kind),
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }))
    );
  if (insertError) throw insertError;
}

export async function setLineItemSelected(id: string, selected: boolean): Promise<void> {
  const { error } = await db().from("line_items").update({ selected }).eq("id", id);
  if (error) throw error;
}

// Fixed items are always included; Package Option/Add-on items only once the
// client has locked in their choice on page 1.
export function getIncludedLineItems(lineItems: LineItem[]): LineItem[] {
  return lineItems.filter((item) => item.kind === "Fixed" || item.selected);
}

export function computeTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
}
