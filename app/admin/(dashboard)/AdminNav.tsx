"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Proposals", href: "/admin/proposals" },
  { label: "Offers", href: "/admin/offers" },
  { label: "Applications", href: "/admin/applications" },
  { label: "Leads", href: "/admin/leads" },
  { label: "Products", href: "/admin/products" },
  { label: "Clients", href: "/admin/clients" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1">
      {LINKS.map((link) => {
        const isActive = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? "admin-nav-link admin-nav-link-active" : "admin-nav-link"}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
