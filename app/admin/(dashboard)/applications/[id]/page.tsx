import { notFound } from "next/navigation";
import { getApplication } from "@/lib/db/applications";
import ApplicationReviewForm from "./ApplicationReviewForm";
import ConvertToProposal from "./ConvertToProposal";

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
      <h1 className="mb-6 font-heading font-[800] text-xl">
        {application.applicantName}
        {application.businessName ? ` · ${application.businessName}` : ""}
      </h1>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2 admin-card p-6">
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

        <div className="flex flex-col gap-6">
          <ApplicationReviewForm
            applicationId={application.id}
            initialStatus={application.status}
            initialFitNotes={application.fitNotesPrivate}
          />
          <ConvertToProposal applicationId={application.id} />
        </div>
      </div>
    </div>
  );
}
