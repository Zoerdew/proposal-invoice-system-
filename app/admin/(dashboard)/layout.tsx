import AdminNav from "./AdminNav";
import LogoutButton from "./LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-blush text-[#0a0608]">
      <nav className="flex items-center justify-between border-b-2 border-[#0a0608] bg-cream px-6 py-3">
        <AdminNav />
        <LogoutButton />
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
