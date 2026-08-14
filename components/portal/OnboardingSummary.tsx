import type { OnboardingResponses } from "@/lib/db/clients";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

function SummaryItem({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mb-6">
      <dt className="text-sm text-[#0a0608]/50 mb-1">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm leading-relaxed">{value}</dd>
    </div>
  );
}

export default function OnboardingSummary({
  businessName,
  bestEmail,
  targetFigure,
  programmeStartDate,
  onboarding,
}: {
  businessName: string;
  bestEmail: string;
  targetFigure: number;
  programmeStartDate: string | null;
  onboarding: OnboardingResponses | null;
}) {
  if (!onboarding) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-2 font-heading font-[800] text-3xl tracking-[-0.03em]">
          What you told us
        </h1>
        <p className="text-sm text-[#0a0608]/50">
          Nothing on record yet — get in touch if this looks wrong.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 font-heading font-[800] text-3xl tracking-[-0.03em]">
        What you told us
      </h1>
      <p className="text-sm text-[#0a0608]/50 mb-10 max-w-sm">
        Read-only — get in touch if anything here needs correcting.
      </p>

      <div className="card-brutal-yellow mb-10 p-6">
        <dl className="grid grid-cols-3 gap-6">
          <div>
            <dt className="text-xs text-[#0a0608]/60 mb-1">Business name</dt>
            <dd className="font-heading font-[800] text-sm">{businessName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#0a0608]/60 mb-1">Best email</dt>
            <dd className="font-heading font-[800] text-sm break-words">{bestEmail || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#0a0608]/60 mb-1">Target figure</dt>
            <dd className="font-heading font-[800] text-sm">{formatCurrency(targetFigure)}</dd>
          </div>
        </dl>
      </div>

      <dl>
        <SummaryItem label="Programme start date" value={programmeStartDate} />
        <SummaryItem label="Best day for check-in" value={onboarding.bestDayForCheckin} />
        <SummaryItem label="Where revenue data lives" value={onboarding.whereRevenueDataLives} />
        <SummaryItem
          label="The last sale that should have happened but didn't"
          value={onboarding.biggestChallengeRightNow}
        />
        <SummaryItem label="What's generating leads now" value={onboarding.whatsGeneratingLeadsNow} />
        <SummaryItem
          label="If nothing changes, the next six months"
          value={onboarding.sixMonthRisk}
        />
        <SummaryItem label="Why now" value={onboarding.whyNow} />
        <SummaryItem label="How you'll know this worked" value={onboarding.definitionOfSuccess} />
        <SummaryItem label="Payment processors" value={onboarding.paymentProcessors} />
        <SummaryItem label="Email platform" value={onboarding.emailPlatform} />
        <SummaryItem
          label="Subscriber count"
          value={onboarding.subscriberCount != null ? String(onboarding.subscriberCount) : null}
        />
        <SummaryItem label="Where enquiries live" value={onboarding.whereEnquiriesLive} />
        <SummaryItem label="Analytics access" value={onboarding.analyticsAccess} />
        <SummaryItem label="What's off the table" value={onboarding.offTheTable} />
        <SummaryItem
          label="What you've already tried and ruled out"
          value={onboarding.whatTheyveTriedAndRuledOut}
        />
        <SummaryItem label="Your own theory" value={onboarding.ownTheory} />
        <SummaryItem label="Postal address" value={onboarding.postalAddress} />
        <SummaryItem label="Anything else" value={onboarding.anythingElse} />
      </dl>
    </div>
  );
}
