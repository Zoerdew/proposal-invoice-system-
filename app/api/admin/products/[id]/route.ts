import { NextRequest, NextResponse } from "next/server";
import { updateProduct } from "@/lib/db/products";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Product name is required." }, { status: 400 });
  }

  await updateProduct(id, {
    name,
    price: body?.price != null ? Number(body.price) : null,
    active: body?.active ?? true,
  });

  return NextResponse.json({ ok: true });
}
