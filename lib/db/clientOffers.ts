import { db } from "./client";

export interface ClientOffer {
  id: string;
  clientId: string;
  name: string;
  price: number | null;
  stillLive: boolean;
  deliveryHours: number | null;
}

export interface ClientOfferInput {
  name: string;
  price?: number | null;
  stillLive?: boolean;
  deliveryHours?: number | null;
}

function toClientOffer(row: {
  id: string;
  client_id: string;
  name: string;
  price: number | null;
  still_live: boolean;
  delivery_hours: number | null;
}): ClientOffer {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    price: row.price,
    stillLive: row.still_live,
    deliveryHours: row.delivery_hours,
  };
}

export async function getClientOffers(clientId: string): Promise<ClientOffer[]> {
  const { data, error } = await db()
    .from("client_offers")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at");
  if (error) throw error;
  return data.map(toClientOffer);
}

export async function createClientOffer(clientId: string, input: ClientOfferInput): Promise<ClientOffer> {
  const { data, error } = await db()
    .from("client_offers")
    .insert({
      client_id: clientId,
      name: input.name,
      price: input.price ?? null,
      still_live: input.stillLive ?? true,
      delivery_hours: input.deliveryHours ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toClientOffer(data);
}

export async function updateClientOffer(id: string, input: ClientOfferInput): Promise<ClientOffer> {
  const { data, error } = await db()
    .from("client_offers")
    .update({
      name: input.name,
      price: input.price ?? null,
      still_live: input.stillLive ?? true,
      delivery_hours: input.deliveryHours ?? null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toClientOffer(data);
}

export async function deleteClientOffer(id: string): Promise<void> {
  const { error } = await db().from("client_offers").delete().eq("id", id);
  if (error) throw error;
}

export async function replaceClientOffers(clientId: string, items: ClientOfferInput[]): Promise<void> {
  const { error: deleteError } = await db().from("client_offers").delete().eq("client_id", clientId);
  if (deleteError) throw deleteError;
  if (items.length === 0) return;

  const { error: insertError } = await db()
    .from("client_offers")
    .insert(
      items.map((item) => ({
        client_id: clientId,
        name: item.name,
        price: item.price ?? null,
        still_live: item.stillLive ?? true,
        delivery_hours: item.deliveryHours ?? null,
      }))
    );
  if (insertError) throw insertError;
}
