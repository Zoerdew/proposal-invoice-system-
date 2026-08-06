import { notFound, redirect } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import OnboardingForm from "@/components/portal/OnboardingForm";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  if (client.onboardingComplete) {
    redirect(`/c/${token}/snapshot`);
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-8 py-12">
      <p className="text-sm tracking-wide uppercase text-[#0a0608]/50 mb-2">
        {client.name} — Welcome
      </p>
      <h1 className="font-heading font-[800] text-4xl mb-3">
        Let&apos;s get you set up
      </h1>
      <p className="text-[#0a0608]/60 mb-10 max-w-sm">
        Ten minutes now saves a lot of guessing later.
      </p>

      <div className="mb-14 p-6 bg-[#0a0608]/[0.03] rounded-md">
        <p className="text-sm tracking-wide uppercase text-[#0a0608]/50 mb-6">
          Here&apos;s what I have — let me know if anything&apos;s changed
        </p>
        <dl className="grid grid-cols-3 gap-6">
          <div>
            <dt className="text-xs text-[#0a0608]/50 mb-1">Business name</dt>
            <dd className="font-heading font-[800] text-sm">
              {client.businessName || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#0a0608]/50 mb-1">Best email</dt>
            <dd className="font-heading font-[800] text-sm break-words">
              {client.bestEmail || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#0a0608]/50 mb-1">Target figure</dt>
            <dd className="font-heading font-[800] text-sm">
              {formatCurrency(client.targetFigure)}
            </dd>
          </div>
        </dl>
      </div>

      <OnboardingForm token={token} />
    </div>
  );
}
