import { notFound } from "next/navigation";
import { getApplication } from "@/lib/db/applications";
import ApplicationReviewForm from "./ApplicationReviewForm";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="mb-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let application;
  try {
    application = await getApplication(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">
        {application.applicantName}
        {application.businessName ? ` · ${application.businessName}` : ""}
      </h1>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2 rounded-lg border border-gray-200 bg-white p-6">
          <dl>
            <Field label="Email" value={application.email} />
            <Field label="Website" value={application.website} />
            <Field label="What the business does" value={application.whatBusinessDoes} />
            <Field label="Time in business" value={application.timeInBusiness} />
            <Field label="Annual turnover" value={application.annualTurnover} />
            <Field label="Main offers & pricing" value={application.mainOffersPricing} />
            <Field label="Top revenue offer" value={application.topRevenueOffer} />
            <Field label="Repeat business" value={application.repeatBusiness} />
            <Field label="Tools used" value={application.toolsUsed.join(", ")} />
            <Field label="Data history" value={application.dataHistory} />
            <Field label="Data state" value={application.dataState} />
            <Field label="What they've tried" value={application.whatTheyveTried} />
            <Field label="Biggest opportunity" value={application.biggestOpportunity} />
            <Field label="Slow week behaviour" value={application.slowWeekBehaviour} />
            <Field label="Why now" value={application.whyNow} />
            <Field label="What they're after" value={application.whatTheyreAfter} />
            <Field label="Openness to evidence & implementing" value={application.opennessToEvidence} />
            <Field label="Start timing" value={application.startTiming} />
            <Field label="Budget fit" value={application.budgetFit} />
            <Field label="Anything else" value={application.anythingElse} />
          </dl>
        </div>

        <div>
          <ApplicationReviewForm
            applicationId={application.id}
            initialStatus={application.status}
            initialFitNotes={application.fitNotesPrivate}
          />
        </div>
      </div>
    </div>
  );
}
