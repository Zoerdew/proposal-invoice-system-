import { notFound } from "next/navigation";
import { getClientByToken, getOnboardingByClientId } from "@/lib/db/clients";
import OnboardingSummary from "@/components/portal/OnboardingSummary";

export const dynamic = "force-dynamic";

export default async function OnboardingSummaryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const onboarding = await getOnboardingByClientId(client.id);

  return (
    <OnboardingSummary
      businessName={client.businessName}
      bestEmail={client.bestEmail}
      targetFigure={client.targetFigure}
      programmeStartDate={client.programmeStartDate}
      onboarding={onboarding}
    />
  );
}
