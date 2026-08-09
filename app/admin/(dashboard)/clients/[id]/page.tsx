import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientAdmin, getOnboardingByClientId } from "@/lib/db/clients";
import ClientTabs from "./ClientTabs";
import ClientForm from "./ClientForm";
import ResendOnboarding from "./ResendOnboarding";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mb-4">
      <dt className="admin-label">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let client;
  try {
    client = await getClientAdmin(id);
  } catch {
    notFound();
  }

  const onboarding = await getOnboardingByClientId(id);

  return (
    <div>
      <h1 className="mb-2 font-heading font-[800] text-xl">
        {client.name}
        {client.businessName ? ` · ${client.businessName}` : ""}
      </h1>
      {client.proposalId && (
        <p className="mb-4 text-sm text-[#0a0608]/50">
          <Link href={`/admin/proposals/${client.proposalId}`} className="underline">
            Linked proposal
          </Link>
        </p>
      )}
      <ClientTabs clientId={id} />

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <ClientForm
            clientId={id}
            initial={{
              name: client.name,
              firstName: client.firstName,
              lastName: client.lastName,
              email: client.email,
              businessName: client.businessName,
              status: client.status,
              startDate: client.startDate,
              endDate: client.endDate,
              packagePrice: client.packagePrice,
              paymentPlan: client.paymentPlan,
              commercialObjectives: client.commercialObjectives,
              notes: client.notes,
              targetFigure: client.targetFigure,
              baselineMonthlyRevenue: client.baselineMonthlyRevenue,
              baselineRepeatBuyerPct: client.baselineRepeatBuyerPct,
              annualTurnover: client.annualTurnover,
              baselineDate: client.baselineDate,
            }}
          />
        </div>

        <div className="flex flex-col gap-6">
          <ResendOnboarding clientId={id} portalToken={client.portalToken} />

          <div className="admin-card p-6">
            <h2 className="mb-2 font-heading font-[800] text-lg">Onboarding responses</h2>
            {!onboarding ? (
              <p className="text-sm text-[#0a0608]/50">Not submitted yet.</p>
            ) : (
              <dl>
                <Field label="Best day for check-in" value={onboarding.bestDayForCheckin} />
                <Field label="Where revenue data lives" value={onboarding.whereRevenueDataLives} />
                <Field label="Biggest challenge right now" value={onboarding.biggestChallengeRightNow} />
                <Field label="What's generating leads now" value={onboarding.whatsGeneratingLeadsNow} />
                <Field label="Six month risk" value={onboarding.sixMonthRisk} />
                <Field label="Why now" value={onboarding.whyNow} />
                <Field label="Definition of success" value={onboarding.definitionOfSuccess} />
                <Field label="Payment processors" value={onboarding.paymentProcessors} />
                <Field label="Email platform" value={onboarding.emailPlatform} />
                <Field
                  label="Subscriber count"
                  value={onboarding.subscriberCount != null ? String(onboarding.subscriberCount) : null}
                />
                <Field label="Where enquiries live" value={onboarding.whereEnquiriesLive} />
                <Field label="Analytics access" value={onboarding.analyticsAccess} />
                <Field label="What's off the table" value={onboarding.offTheTable} />
                <Field
                  label="What they've tried and ruled out"
                  value={onboarding.whatTheyveTriedAndRuledOut}
                />
                <Field label="Their own theory" value={onboarding.ownTheory} />
                <Field label="Anything else" value={onboarding.anythingElse} />
              </dl>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
