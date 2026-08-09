import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/db/products";

export async function GET() {
  const products = await listProducts();
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }

  const product = await createProduct({
    name,
    price: body?.price != null ? Number(body.price) : null,
    active: body?.active ?? true,
  });

  return NextResponse.json({ id: product.id }, { status: 201 });
}
