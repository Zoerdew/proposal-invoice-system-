import { NextRequest, NextResponse } from "next/server";
import { replaceClientOffers } from "@/lib/db/clientOffers";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  await replaceClientOffers(
    id,
    items
      .filter((item: { name?: unknown }) => typeof item.name === "string" && item.name.trim())
      .map((item: { name: string; price?: number; stillLive?: boolean; deliveryHours?: number }) => ({
        name: item.name,
        price: item.price,
        stillLive: item.stillLive,
        deliveryHours: item.deliveryHours,
      }))
  );

  return NextResponse.json({ ok: true });
}
