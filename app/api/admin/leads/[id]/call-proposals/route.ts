import { NextRequest, NextResponse } from "next/server";
import { getLead } from "@/lib/db/leads";
import { createCallProposal, listCallProposalsForLead } from "@/lib/db/callProposals";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const callProposals = await listCallProposalsForLead(id);
  return NextResponse.json(callProposals);
}

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
  const html = typeof body?.html === "string" ? body.html.trim() : "";
  const currency = typeof body?.currency === "string" && body.currency ? body.currency : "GBP";
  const callDate = typeof body?.callDate === "string" && body.callDate ? body.callDate : null;

  if (!prospectName || !transcript || !html) {
    return NextResponse.json(
      { error: "Prospect name, transcript, and generated HTML are required." },
      { status: 400 }
    );
  }

  const callProposal = await createCallProposal({
    leadId: id,
    prospectName,
    callDate,
    currency,
    transcript,
    generatedHtml: html,
  });

  return NextResponse.json({ id: callProposal.id, slug: callProposal.slug }, { status: 201 });
}
