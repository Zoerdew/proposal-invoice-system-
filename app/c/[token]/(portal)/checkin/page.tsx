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
      <p className="text-sm tracking-wide uppercase text-[#0a0608]/50 mb-10">
        Weekly Check-in
      </p>
      <CheckinForm token={token} />
    </div>
  );
}
