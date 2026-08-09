import { NextRequest, NextResponse } from "next/server";
import { convertLeadToProposal } from "@/lib/db/leads";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { proposalId } = await convertLeadToProposal(id);
  return NextResponse.json({ ok: true, proposalId });
}
