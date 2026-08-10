"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const IN_CONTROL_TABS = [
  { label: "Snapshot", segment: "snapshot" },
  { label: "GOLD", segment: "gold" },
  { label: "Evidence", segment: "evidence" },
  { label: "Scorecard", segment: "scorecard" },
  { label: "Check-in", segment: "checkin" },
  { label: "To-dos", segment: "todos" },
] as const;

// V3 Phase 15: every other Falling Forwards product gets just this —
// the In Control deliverables (GOLD Report, Evidence Dashboard, Commercial
// Scorecard) don't exist for them, so there's nothing to link to yet.
const OTHER_PRODUCT_TABS = [{ label: "To-dos", segment: "todos" }] as const;

export default function PortalNav({
  token,
  clientName,
  isInControl,
}: {
  token: string;
  clientName: string;
  isInControl: boolean;
}) {
  const pathname = usePathname();
  const tabs = isInControl ? IN_CONTROL_TABS : OTHER_PRODUCT_TABS;

  return (
    <header className="border-b-[3px] border-[#0a0608] bg-cream">
      <div className="max-w-5xl mx-auto w-full px-8 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/zd-monogram.png"
            alt="Zoë Dew"
            width={40}
            height={40}
            className="h-8 w-8"
          />
          <p className="font-heading font-[800] text-lg leading-none">
            {isInControl ? "In Control" : "Falling Forwards"}
          </p>
        </div>
        <p className="text-sm text-[#0a0608]/50">{clientName}</p>
      </div>
      <nav className="max-w-5xl mx-auto w-full px-8">
        <ul className="flex gap-3 flex-wrap pb-4">
          {tabs.map((tab) => {
            const href = `/c/${token}/${tab.segment}`;
            const isActive = pathname?.startsWith(href);
            return (
              <li key={tab.segment}>
                <Link
                  href={href}
                  data-active={isActive}
                  className="pill-toggle inline-block px-4 py-1.5 text-xs font-heading font-[800] data-[active=false]:border-[#0a0608]/15 data-[active=false]:text-[#0a0608]/50 data-[active=false]:hover:border-[#0a0608]/40 data-[active=false]:hover:text-[#0a0608]/80"
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
