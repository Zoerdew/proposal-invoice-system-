import { NextRequest, NextResponse } from "next/server";
import { getCallProposalBySlug } from "@/lib/db/callProposals";

// A plain mailto link, not a form/fetch — the prospect's own email client
// has to actually send it, so there's no auto-send path. Injected as a
// fixed HTML block (not asked of the generator's system prompt) so it
// renders identically every time, independent of what the model produces
// for the rest of the page.
function confirmCtaBlock(prospectName: string): string {
  const subject = "Ready to go ahead";
  const body = `Hi Zoë,\n\nI'm ready to go ahead.\n\n${prospectName}`;
  const href = `mailto:hello@zoedew.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return `<div style="max-width:640px;margin:48px auto;padding:40px 32px;border-radius:20px;background:#fff4fa;border:2px solid #0a0608;text-align:center;font-family:'Bricolage Grotesque',sans-serif;">
  <p style="font-weight:800;font-size:22px;margin:0 0 8px;color:#0a0608;">Ready to go ahead?</p>
  <p style="color:#0a060899;margin:0 0 24px;max-width:420px;margin-left:auto;margin-right:auto;">One click opens an email to Zoë saying you're in — she'll take it from there.</p>
  <a href="${href}" style="display:inline-block;border:2px solid #0a0608;border-radius:9999px;background:#0a0608;color:#fff4fa;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;padding:14px 32px;font-size:14px;text-decoration:none;font-family:inherit;">Confirm you want to go ahead</a>
</div>`;
}

// Inserts the block right before </body> (case-insensitive, matching
// however the model closed the document), or appends if somehow absent.
function injectConfirmCta(html: string, prospectName: string): string {
  const block = confirmCtaBlock(prospectName);
  const closingBodyIndex = html.search(/<\/body>/i);
  if (closingBodyIndex === -1) return html + block;
  return html.slice(0, closingBodyIndex) + block + html.slice(closingBodyIndex);
}

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

  const html = injectConfirmCta(callProposal.generatedHtml, callProposal.prospectName);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Belt-and-braces on top of the noindex meta tag the model is
      // instructed to include — every one of these pages is private.
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
