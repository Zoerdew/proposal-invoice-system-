import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";
import CheckinForm from "@/components/portal/CheckinForm";

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  return (
    <div>
      <div className="flex flex-col items-start gap-4 mb-10">
        <span className="eyebrow-pill">In Control</span>
        <h1 className="font-heading font-[800] text-4xl md:text-5xl leading-[0.98] tracking-[-0.03em]">
          Weekly <span className="text-accent">Check-in</span>
        </h1>
      </div>
      <CheckinForm token={token} />
    </div>
  );
}
