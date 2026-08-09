"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const PROOF_TYPES = ["Testimonial", "Thank You", "Unprompted Praise"] as const;
type ProofType = (typeof PROOF_TYPES)[number];

export default function ProofForm({ token }: { token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ProofType>("Testimonial");
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData();
    formData.set("type", type);
    formData.set("text", text);
    formData.set("source", source);
    if (screenshot) formData.set("screenshot", screenshot);

    const res = await fetch(`/api/proof/${token}`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setText("");
      setSource("");
      setScreenshot(null);
      setType("Testimonial");
      setStatus("idle");
      setOpen(false);
      router.refresh();
    } else {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-pill px-5 py-2.5 text-xs">
        + Add proof
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal p-6 max-w-md">
      <div className="mb-4">
        <p className="block text-sm text-[#0a0608]/60 mb-2">Type</p>
        <div className="flex gap-2 flex-wrap">
          {PROOF_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              data-active={type === option}
              onClick={() => setType(option)}
              className="pill-toggle px-3 py-1.5 text-xs font-heading font-[800] data-[active=false]:border-[#0a0608]/25 data-[active=false]:text-[#0a0608]/60"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-[#0a0608]/60 mb-2" htmlFor="proof-text">
          What did they say?
        </label>
        <textarea
          id="proof-text"
          required
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-brutal w-full p-3 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-[#0a0608]/60 mb-2" htmlFor="proof-source">
          Source
        </label>
        <input
          id="proof-source"
          required
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="e.g. Slack DM, Email"
          className="input-brutal w-full p-3 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream placeholder:text-[#0a0608]/30"
        />
      </div>

      <div className="mb-6">
        <label
          className="block text-sm text-[#0a0608]/60 mb-2"
          htmlFor="proof-screenshot"
        >
          Screenshot (optional)
        </label>
        <input
          id="proof-screenshot"
          type="file"
          accept="image/*"
          onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          className="text-sm text-[#0a0608]/70"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 mb-4">
          Couldn&apos;t save that — try again.
        </p>
      )}

      <div className="flex gap-4 items-center">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-pill px-5 py-2.5 text-xs"
        >
          {status === "submitting" ? "Saving..." : "Save proof"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[#0a0608]/50 hover:text-[#F11787]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
