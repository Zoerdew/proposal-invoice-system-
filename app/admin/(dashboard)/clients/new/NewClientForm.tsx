"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/db/products";

export default function NewClientForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, businessName, productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/admin/clients/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl admin-card p-6">
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="admin-label mb-1 block">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="admin-input w-full px-3 py-2" />
        </div>
        <div>
          <label className="admin-label mb-1 block">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input w-full px-3 py-2" />
        </div>
      </div>

      <div className="mb-4">
        <label className="admin-label mb-1 block">
          Business name <span className="normal-case font-normal text-[#0a0608]/40">(optional)</span>
        </label>
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="admin-input w-full px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <label className="admin-label mb-1 block">Product</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="admin-input w-full px-3 py-2"
        >
          <option value="">— choose a product —</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[#0a0608]/50">
          Doesn&apos;t send anything — this just creates the client and a portal link. Share the
          link yourself from their detail page once they&apos;re added.
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !name.trim() || !email.trim() || !productId}
        className="admin-btn px-4 py-2"
      >
        {saving ? "Creating…" : "Create client"}
      </button>
    </div>
  );
}
