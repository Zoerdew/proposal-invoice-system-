import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";

/**
 * Every route under /c/[token] shares this gate: no valid Client record,
 * no render. Onboarding-complete gating and the tab nav live one level
 * down in (portal)/layout.tsx, since the onboarding page itself sits
 * outside that group and shouldn't show the portal nav or be redirected
 * back to itself.
 */
export default async function ClientPortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  return (
    <div className="min-h-screen bg-blush text-[#0a0608]">{children}</div>
  );
}
