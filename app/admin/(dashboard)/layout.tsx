import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/admin/proposals" className="text-gray-700 hover:text-gray-900">
            Proposals
          </Link>
          <Link href="/admin/offers" className="text-gray-700 hover:text-gray-900">
            Offers
          </Link>
        </div>
        <LogoutButton />
      </nav>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
