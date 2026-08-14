// mailto: links only work if the device has a mail app registered with
// the OS — no such thing as a universal one-click email link. Leads with
// "reply to the email" (works everywhere, since this page is normally
// reached via an email Zoë sent), keeps the mailto as a bonus for devices
// that do support it, and shows the plain address as a copyable fallback
// for everyone else.
export default function RecapConfirmCta({ clientName }: { clientName: string }) {
  const subject = "Ready to go ahead";
  const body = `Hi Zoë,\n\nI'm ready to go ahead — from the call recap.\n\n${clientName}`;
  const href = `mailto:hello@zoedew.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="bg-cream rounded-[20px] border-2 border-[#0a0608] p-8 text-center">
      <p className="font-heading font-[800] text-xl mb-2">Ready to go ahead?</p>
      <p className="text-[#0a0608]/60 max-w-md mx-auto mb-2">
        Reply to the email I sent you, or drop a line to{" "}
        <a href={href} className="text-[#0a0608] underline">
          hello@zoedew.com
        </a>
        , and I&apos;ll take it from there.
      </p>
    </div>
  );
}
