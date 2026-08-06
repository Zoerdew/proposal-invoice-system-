import { NextRequest, NextResponse } from "next/server";
import { LineItemKind } from "@/lib/db/shared";
import { createProposal } from "@/lib/db/proposals";
import { replaceLineItems } from "@/lib/db/lineItems";
import { ensureUniqueSlug, slugify } from "@/lib/slug";

interface LineItemInput {
  description: string;
  kind: LineItemKind;
  quantity: number;
  unitPrice: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  if (!clientName) {
    return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  }
  const lineItems: LineItemInput[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  const slug = await ensureUniqueSlug(slugify(clientName));

  const proposal = await createProposal({
    clientName,
    clientEmail: body.clientEmail || null,
    company: body.company || null,
    contractTerms: body.contractTerms || null,
    offerId: body.offerId || null,
    depositAmount: typeof body.depositAmount === "number" ? body.depositAmount : null,
    slug,
  });

  await replaceLineItems(
    proposal.id,
    lineItems.filter((item) => item.description?.trim())
  );

  return NextResponse.json({
    id: proposal.id,
    slug,
    proposalLink: proposal.proposalLink,
  });
}
