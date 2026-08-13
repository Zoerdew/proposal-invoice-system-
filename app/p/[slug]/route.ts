import { NextRequest, NextResponse } from "next/server";
import { getCallProposalBySlug } from "@/lib/db/callProposals";

// The confirm CTA is injected here (plain HTML/inline styles/vanilla JS,
// not React) rather than asked of the generator's system prompt — a
// fixed, code-owned block renders identically every time, where relying
// on the model to place and style it consistently inside a one-off
// generated document would not.
function confirmedBlock(): string {
  return `<div style="max-width:640px;margin:48px auto;padding:40px 32px;border-radius:20px;background:#0a0608;color:#fff4fa;text-align:center;font-family:'Bricolage Grotesque',sans-serif;">
  <p style="font-weight:800;font-size:22px;margin:0 0 8px;">Confirmed.</p>
  <p style="opacity:0.7;margin:0;max-width:420px;margin:0 auto;">Zoë's been notified — she'll follow up to get things moving.</p>
</div>`;
}

function confirmCtaBlock(slug: string): string {
  return `<div id="ff-confirm-wrap" style="max-width:640px;margin:48px auto;padding:40px 32px;border-radius:20px;background:#fff4fa;border:2px solid #0a0608;text-align:center;font-family:'Bricolage Grotesque',sans-serif;">
  <p style="font-weight:800;font-size:22px;margin:0 0 8px;color:#0a0608;">Ready to go ahead?</p>
  <p style="color:#0a060899;margin:0 0 24px;max-width:420px;margin-left:auto;margin-right:auto;">One click sends Zoë a note to say you're in — she'll take it from there.</p>
  <button id="ff-confirm-btn" style="display:inline-block;border:2px solid #0a0608;border-radius:9999px;background:#0a0608;color:#fff4fa;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;padding:14px 32px;font-size:14px;cursor:pointer;font-family:inherit;">Confirm you want to go ahead</button>
  <p id="ff-confirm-error" style="display:none;color:#F11787;margin:16px 0 0;font-size:14px;">Something went wrong — try again, or just reply to Zoë directly.</p>
</div>
<script>
(function () {
  var btn = document.getElementById('ff-confirm-btn');
  var err = document.getElementById('ff-confirm-error');
  var wrap = document.getElementById('ff-confirm-wrap');
  btn.addEventListener('click', function () {
    btn.disabled = true;
    btn.textContent = 'Sending…';
    err.style.display = 'none';
    fetch('/api/p/${slug}/confirm', { method: 'POST' })
      .then(function (res) {
        if (!res.ok) throw new Error('failed');
        wrap.outerHTML = ${JSON.stringify(confirmedBlock())};
      })
      .catch(function () {
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Confirm you want to go ahead';
      });
  });
})();
</script>`;
}

// Inserts a block right before </body> (case-insensitive, matching
// however the model closed the document), or appends if somehow absent.
function injectConfirmCta(html: string, slug: string, confirmed: boolean): string {
  const block = confirmed ? confirmedBlock() : confirmCtaBlock(slug);
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

  const html = injectConfirmCta(callProposal.generatedHtml, slug, Boolean(callProposal.confirmedAt));

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Belt-and-braces on top of the noindex meta tag the model is
      // instructed to include — every one of these pages is private.
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
