import { notFound, redirect } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import PortalNav from "@/components/portal/PortalNav";

/**
 * Shared gate for every page in the portal proper (Snapshot, GOLD,
 * Evidence, Check-in). Onboarding must be complete before any of these
 * render — this is the one place that's enforced, so it never has to be
 * repeated per page.
 */
export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  if (!client.onboardingComplete) {
    redirect(`/c/${token}/onboarding`);
  }

  return (
    <>
      <PortalNav token={token} clientName={client.name} />
      <main className="max-w-4xl mx-auto w-full px-8 py-12">{children}</main>
    </>
  );
}
