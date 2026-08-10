import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import LoginForm from "@/components/portal/LoginForm";

export default async function PortalLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const client = await getClientByToken(token);
  if (!client) notFound();

  return (
    <div className="min-h-screen bg-blush flex flex-col items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-4 mb-10 text-center">
        <span className="eyebrow-pill">In Control</span>
        <h1 className="font-heading font-[800] text-4xl leading-[0.98] tracking-[-0.03em]">
          Log in to your <span className="text-accent">portal</span>
        </h1>
        {error === "expired" && (
          <p className="text-sm text-red-600">
            That link has expired or already been used — request a new one below.
          </p>
        )}
      </div>
      <LoginForm token={token} />
    </div>
  );
}
