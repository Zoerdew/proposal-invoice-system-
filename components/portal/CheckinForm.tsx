"use client";

import { FormEvent, useState } from "react";

type FeltLike = "Ahead" | "On track" | "Behind";

const FELT_LIKE_OPTIONS: FeltLike[] = ["Ahead", "On track", "Behind"];

export default function CheckinForm({ token }: { token: string }) {
  const [revenueThisWeek, setRevenueThisWeek] = useState("");
  const [qualitativeNotes, setQualitativeNotes] = useState("");
  const [feltLike, setFeltLike] = useState<FeltLike | "">("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feltLike) return;

    setStatus("submitting");

    const res = await fetch(`/api/checkins/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revenueThisWeek: Number(revenueThisWeek),
        qualitativeNotes,
        feltLike,
      }),
    });

    if (res.ok) {
      setStatus("done");
      setRevenueThisWeek("");
      setQualitativeNotes("");
      setFeltLike("");
    } else {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="card-brutal py-16 text-center px-8">
        <p className="font-heading font-[800] text-2xl mb-2">Check-in logged</p>
        <p className="text-sm text-[#0a0608]/60 mb-8">
          Thanks — this week is in. You&apos;ll see it show up on the Evidence page.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="text-sm tracking-wide uppercase text-[#0a0608]/60 hover:text-[#F11787] underline"
        >
          Log another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal max-w-md p-8">
      <div className="mb-8">
        <label className="block text-sm text-[#0a0608]/60 mb-2" htmlFor="revenue">
          Revenue this week
        </label>
        <div className="input-brutal flex items-center px-4 focus-within:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream">
          <span className="text-2xl font-heading font-[800] mr-2">£</span>
          <input
            id="revenue"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            value={revenueThisWeek}
            onChange={(e) => setRevenueThisWeek(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent py-3 text-2xl font-heading font-[800] outline-none placeholder:text-[#0a0608]/20"
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm text-[#0a0608]/60 mb-2" htmlFor="notes">
          What happened this week?
        </label>
        <textarea
          id="notes"
          required
          rows={5}
          value={qualitativeNotes}
          onChange={(e) => setQualitativeNotes(e.target.value)}
          placeholder="Wins, blockers, anything worth flagging..."
          className="input-brutal w-full p-4 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream placeholder:text-[#0a0608]/30"
        />
      </div>

      <div className="mb-10">
        <p className="block text-sm text-[#0a0608]/60 mb-2">How did it feel?</p>
        <div className="flex gap-3">
          {FELT_LIKE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              data-active={feltLike === option}
              onClick={() => setFeltLike(option)}
              className="pill-toggle px-4 py-2 text-xs font-heading font-[800] data-[active=false]:border-[#0a0608]/25 data-[active=false]:text-[#0a0608]/60 data-[active=false]:hover:border-[#0a0608]"
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 mb-4">
          Something went wrong submitting that — try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !feltLike}
        className="btn-pill px-6 py-3 text-sm"
      >
        {status === "submitting" ? "Submitting..." : "Submit check-in"}
      </button>
    </form>
  );
}
