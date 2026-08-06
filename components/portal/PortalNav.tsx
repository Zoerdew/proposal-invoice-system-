"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Snapshot", segment: "snapshot" },
  { label: "GOLD", segment: "gold" },
  { label: "Evidence", segment: "evidence" },
  { label: "Check-in", segment: "checkin" },
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
    <header className="border-b border-[#0a0608]/10">
      <div className="max-w-2xl mx-auto w-full px-8 pt-10 pb-6 flex items-center justify-between">
        <p className="font-heading font-[800] text-lg leading-none">
          In Control
        </p>
        <p className="text-sm text-[#0a0608]/50">{clientName}</p>
      </div>
      <nav className="max-w-2xl mx-auto w-full px-8">
        <ul className="flex gap-6">
          {TABS.map((tab) => {
            const href = `/c/${token}/${tab.segment}`;
            const isActive = pathname?.startsWith(href);
            return (
              <li key={tab.segment}>
                <Link
                  href={href}
                  className={`inline-block pb-4 text-sm tracking-wide uppercase border-b-2 transition-colors ${
                    isActive
                      ? "border-[#F11787] text-[#0a0608]"
                      : "border-transparent text-[#0a0608]/50 hover:text-[#0a0608]/80"
                  }`}
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
