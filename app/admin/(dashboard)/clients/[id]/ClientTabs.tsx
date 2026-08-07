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
    <nav className="mb-6 flex gap-4 border-b border-gray-200 text-sm">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.label}
            href={href}
            className={`-mb-px border-b-2 px-1 pb-2 font-medium ${
              isActive
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
