import { notFound } from "next/navigation";
import { getClientByToken } from "@/lib/db/clients";

function daysRemaining(startDate: string): number {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 90);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / msPerDay));
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function SnapshotPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();

  const progressPct = Math.min(
    100,
    Math.round((client.totalIdentified / client.targetFigure) * 100)
  );
  const daysLeft = daysRemaining(client.programmeStartDate ?? new Date().toISOString());

  return (
    <div>
      <p className="text-sm tracking-wide uppercase text-[#0a0608]/50 mb-2">
        Commercial Snapshot
      </p>

      <div className="grid grid-cols-2 gap-x-8 gap-y-10 mt-10">
        <div>
          <p className="text-sm text-[#0a0608]/60 mb-1">Identified</p>
          <p className="font-heading font-[800] text-5xl leading-none">
            {formatCurrency(client.totalIdentified)}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#0a0608]/60 mb-1">Banked</p>
          <p className="font-heading font-[800] text-5xl leading-none">
            {formatCurrency(client.totalBanked)}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between text-sm text-[#0a0608]/60 mb-2">
          <span>Progress against target</span>
          <span>{formatCurrency(client.targetFigure)}</span>
        </div>
        <div className="h-2 w-full bg-[#0a0608]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F11787] rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-sm text-[#0a0608]/60 mt-2">{progressPct}%</p>
      </div>

      <div className="mt-12 pt-6 border-t border-[#0a0608]/10 flex justify-between items-baseline">
        <p className="text-sm text-[#0a0608]/60">Days remaining</p>
        <p className="font-heading font-[800] text-2xl">{daysLeft}</p>
      </div>
    </div>
  );
}
