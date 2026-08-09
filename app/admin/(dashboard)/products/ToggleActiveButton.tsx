"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ToggleActiveButton({
  productId,
  name,
  price,
  active,
}: {
  productId: string;
  name: string;
  price: number | null;
  active: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price, active: !active }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      className="admin-btn-secondary text-xs px-3 py-1.5"
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}
