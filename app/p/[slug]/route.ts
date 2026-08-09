import { NextRequest, NextResponse } from "next/server";
import { getCallProposalBySlug } from "@/lib/db/callProposals";

// A Route Handler, not a page — the stored HTML is a complete,
// self-contained document with its own <html>/<head> (inline CSS, its own
// noindex meta per the generator's system prompt). Running it through
// app/layout.tsx would nest a second <html> inside the root one.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const callProposal = await getCallProposalBySlug(slug);

  if (!callProposal || !callProposal.generatedHtml) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(callProposal.generatedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Belt-and-braces on top of the noindex meta tag the model is
      // instructed to include — every one of these pages is private.
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
