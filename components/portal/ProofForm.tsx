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
      <button
        onClick={() => setOpen(true)}
        className="text-sm tracking-wide uppercase text-[#0a0608]/60 hover:text-[#0a0608] border border-[#0a0608]/20 rounded-full px-4 py-2"
      >
        + Add proof
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-[#0a0608]/10 rounded-md p-6 max-w-md"
    >
      <div className="mb-4">
        <p className="block text-sm text-[#0a0608]/60 mb-2">Type</p>
        <div className="flex gap-2 flex-wrap">
          {PROOF_TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setType(option)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                type === option
                  ? "border-[#F11787] text-[#F11787]"
                  : "border-[#0a0608]/20 text-[#0a0608]/60"
              }`}
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
          className="w-full border border-[#0a0608]/20 rounded-md p-3 text-sm outline-none focus:border-[#0a0608] bg-transparent"
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
          className="w-full border-b border-[#0a0608]/20 py-2 text-sm outline-none focus:border-[#0a0608] bg-transparent placeholder:text-[#0a0608]/30"
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-[#0a0608] text-[#FAF3E9] text-sm tracking-wide uppercase px-5 py-2.5 rounded-md disabled:opacity-40"
        >
          {status === "submitting" ? "Saving..." : "Save proof"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[#0a0608]/50 hover:text-[#0a0608]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
