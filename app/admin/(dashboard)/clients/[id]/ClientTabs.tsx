"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Details", segment: "" },
  { label: "Findings", segment: "findings" },
  { label: "Offers", segment: "offers" },
  { label: "Timeline", segment: "timeline" },
  { label: "Data sources", segment: "data-sources" },
  { label: "Decisions", segment: "decisions" },
  { label: "Metrics", segment: "metrics" },
] as const;

export default function ClientTabs({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;

  return (
    <nav className="mb-6 flex gap-4 border-b-2 border-[#0a0608]/15 text-sm">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`-mb-0.5 border-b-2 px-1 pb-2 font-heading font-[800] ${
              isActive
                ? "border-[#F11787] text-[#0a0608]"
                : "border-transparent text-[#0a0608]/50 hover:text-[#0a0608]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
