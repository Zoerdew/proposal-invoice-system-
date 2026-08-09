"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignatureForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signedName.trim() || !agreed) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, signedName, confirmed: agreed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/proposal/${slug}/invoice`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal p-6">
      <h2 className="mb-4 text-lg font-heading font-[800]">Sign to accept</h2>
      <label className="mb-1 block text-sm font-medium text-[#0a0608]/70">
        Type your full name
      </label>
      <input
        type="text"
        value={signedName}
        onChange={(e) => setSignedName(e.target.value)}
        className="input-brutal mb-4 w-full px-3 py-2.5 focus:shadow-[3px_3px_0_#F11787] transition-shadow outline-none"
        placeholder="Jane Smith"
        required
      />
      <label className="mb-4 flex items-start gap-2 text-sm text-[#0a0608]/70">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 accent-[#F11787]"
          required
        />
        I agree to the terms above.
      </label>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !signedName.trim() || !agreed}
        className="btn-pill w-full px-6 py-3 text-sm"
      >
        {submitting ? "Submitting…" : "Sign & submit"}
      </button>
    </form>
  );
}
