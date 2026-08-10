import { notFound, redirect } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import { listProducts } from "@/lib/db/products";
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

  // V3 Phase 15: the full In Control tab set (Snapshot/GOLD/Evidence/
  // Scorecard/Check-in) only makes sense for In Control clients — every
  // other product gets a reduced nav rather than pages full of empty
  // In-Control-shaped data.
  const products = await listProducts();
  const isInControl = products.find((p) => p.id === client.productId)?.name === "In Control";

  return (
    <>
      <PortalNav token={token} clientName={client.name} isInControl={isInControl} />
      <main className="max-w-5xl mx-auto w-full px-8 py-12">{children}</main>
    </>
  );
}
