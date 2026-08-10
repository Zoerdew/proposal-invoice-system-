import { NextRequest, NextResponse } from "next/server";
import { createClientManually } from "@/lib/db/clients";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "";
  const productId = typeof body?.productId === "string" ? body.productId : "";

  if (!name || !email || !productId) {
    return NextResponse.json(
      { error: "Name, email, and product are required." },
      { status: 400 }
    );
  }

  const client = await createClientManually({
    name,
    email,
    businessName: businessName || null,
    productId,
  });

  return NextResponse.json({ id: client.id }, { status: 201 });
}
