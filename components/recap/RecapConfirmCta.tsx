// Plain mailto link, not a form/fetch — the client's own email client has
// to actually send it, so there's no auto-send path here at all.
export default function RecapConfirmCta({ clientName }: { clientName: string }) {
  const subject = "Ready to go ahead";
  const body = `Hi Zoë,\n\nI'm ready to go ahead — from the call recap.\n\n${clientName}`;
  const href = `mailto:hello@zoedew.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="bg-cream rounded-[20px] border-2 border-[#0a0608] p-8 text-center">
      <p className="font-heading font-[800] text-xl mb-2">Ready to go ahead?</p>
      <p className="text-[#0a0608]/60 max-w-md mx-auto mb-6">
        One click opens an email to Zoë saying you&apos;re in — she&apos;ll take it from there.
      </p>
      <a href={href} className="btn-pill px-8 py-3 inline-block">
        Confirm you want to go ahead
      </a>
    </div>
  );
}
