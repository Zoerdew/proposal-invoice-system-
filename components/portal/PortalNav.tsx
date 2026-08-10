"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Snapshot", segment: "snapshot" },
  { label: "GOLD", segment: "gold" },
  { label: "Evidence", segment: "evidence" },
  { label: "Scorecard", segment: "scorecard" },
  { label: "Check-in", segment: "checkin" },
  { label: "To-dos", segment: "todos" },
] as const;

export default function PortalNav({
  token,
  clientName,
}: {
  token: string;
  clientName: string;
}) {
  const pathname = usePathname();

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
            In Control
          </p>
        </div>
        <p className="text-sm text-[#0a0608]/50">{clientName}</p>
      </div>
      <nav className="max-w-5xl mx-auto w-full px-8">
        <ul className="flex gap-3 flex-wrap pb-4">
          {TABS.map((tab) => {
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
