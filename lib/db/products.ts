import { db } from "./client";

// Generalises what `offers` does today to every Falling Forwards offer, not
// just In Control. Deliberately smaller than `offers` — no tagline,
// description, contract terms, or payment plans, since those are
// offer-package concerns, not properties of a product itself. Does not
// replace `offers`, which stays specifically the In Control proposal
// template/line-item source.
export interface Product {
  id: string;
  name: string;
  price: number | null;
  active: boolean;
}

export interface ProductInput {
  name: string;
  price?: number | null;
  active?: boolean;
}

function toProduct(row: {
  id: string;
  name: string;
  price: number | null;
  active: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    active: row.active,
  };
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await db().from("products").select("*").order("name");
  if (error) throw error;
  return data.map(toProduct);
}

export async function listActiveProducts(): Promise<Product[]> {
  const { data, error } = await db()
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data.map(toProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await db()
    .from("products")
    .insert({
      name: input.name,
      price: input.price ?? null,
      active: input.active ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return toProduct(data);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await db()
    .from("products")
    .update({
      name: input.name,
      price: input.price ?? null,
      active: input.active ?? true,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toProduct(data);
}
