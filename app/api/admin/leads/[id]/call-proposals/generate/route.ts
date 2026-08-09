import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/db/leads";
import { generateCallProposalHtml } from "@/lib/anthropic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await getLead(id).catch(() => null);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const prospectName = typeof body?.prospectName === "string" ? body.prospectName.trim() : "";
  const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
  const currency = typeof body?.currency === "string" && body.currency ? body.currency : "GBP";
  const callDate = typeof body?.callDate === "string" && body.callDate ? body.callDate : null;
  const pricingContext =
    typeof body?.pricingContext === "string" ? body.pricingContext : undefined;

  if (!prospectName || !transcript) {
    return NextResponse.json(
      { error: "Prospect name and transcript are required." },
      { status: 400 }
    );
  }

  const html = await generateCallProposalHtml({
    prospectName,
    callDate,
    currency,
    transcript,
    pricingContext,
  });
  return NextResponse.json({ html });
}
