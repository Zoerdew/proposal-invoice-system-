import { NextRequest, NextResponse } from "next/server";
import { convertApplicationToProposal } from "@/lib/db/applications";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { proposalId } = await convertApplicationToProposal(id);
  return NextResponse.json({ ok: true, proposalId });
}
