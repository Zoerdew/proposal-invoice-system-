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
      <div className="flex flex-col items-start gap-4 mb-10">
        <span className="eyebrow-pill">In Control</span>
        <h1 className="font-heading font-[800] text-4xl md:text-5xl leading-[0.98] tracking-[-0.03em]">
          Commercial <span className="text-accent">Snapshot</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card-brutal tilt-l p-6">
          <p className="text-sm text-[#0a0608]/60 mb-1">Identified</p>
          <p className="font-heading font-[800] text-4xl leading-none tracking-[-0.03em]">
            {formatCurrency(client.totalIdentified)}
          </p>
        </div>
        <div className="card-brutal-pink tilt-r p-6">
          <p className="text-sm text-[#0a0608]/60 mb-1">Banked</p>
          <p className="font-heading font-[800] text-4xl leading-none tracking-[-0.03em]">
            {formatCurrency(client.totalBanked)}
          </p>
        </div>
      </div>

      <div className="card-brutal-blush relative mt-10 p-6">
        <span className="card-tab card-tab-yellow">
          Target {formatCurrency(client.targetFigure)}
        </span>
        <div className="flex justify-between text-sm text-[#0a0608]/60 mb-3 mt-2">
          <span>Progress against target</span>
          <span className="font-heading font-[800] text-[#0a0608]">{progressPct}%</span>
        </div>
        <div className="h-4 w-full bg-cream rounded-full border-2 border-[#0a0608] overflow-hidden">
          <div
            className="h-full bg-[#F11787]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="card-brutal-yellow mt-8 p-6 flex justify-between items-baseline">
        <p className="text-sm text-[#0a0608]/70">Days remaining</p>
        <p className="font-heading font-[800] text-2xl">{daysLeft}</p>
      </div>
    </div>
  );
}
