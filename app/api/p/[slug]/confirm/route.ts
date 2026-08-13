import { NextRequest, NextResponse } from "next/server";
import { getCallProposalBySlug, confirmCallProposal } from "@/lib/db/callProposals";
import { sendConfirmedEmail } from "@/lib/email";

// Not behind any login — same reasoning as the recap confirm route: an
// unlisted, noindex slug is the access model for a call proposal.
// Idempotent by design: a second click doesn't re-send Zoë's email or
// overwrite the original confirmed_at.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const callProposal = await getCallProposalBySlug(slug);
  if (!callProposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (callProposal.confirmedAt) {
    return NextResponse.json({ confirmedAt: callProposal.confirmedAt });
  }

  const updated = await confirmCallProposal(callProposal.id);

  await sendConfirmedEmail({
    clientName: callProposal.prospectName,
    pageUrl: `${request.nextUrl.origin}/p/${slug}`,
  });

  return NextResponse.json({ confirmedAt: updated.confirmedAt });
}
