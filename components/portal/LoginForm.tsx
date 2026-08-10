"use client";

import { FormEvent, useState } from "react";

export default function LoginForm({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    await fetch(`/api/portal/${token}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Always the same outcome shown, whether or not the email matched —
    // this endpoint deliberately never reveals which.
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="card-brutal py-16 text-center px-8 max-w-md">
        <p className="font-heading font-[800] text-2xl mb-2">Check your email</p>
        <p className="text-sm text-[#0a0608]/60">
          If that email matches a client on this link, we&apos;ve sent a login link. It expires in
          15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-brutal max-w-md p-8">
      <div className="mb-8">
        <label className="block text-sm text-[#0a0608]/60 mb-2" htmlFor="email">
          Your email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-brutal w-full p-4 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream placeholder:text-[#0a0608]/30"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting" || !email}
        className="btn-pill px-6 py-3 text-sm"
      >
        {status === "submitting" ? "Sending..." : "Send login link"}
      </button>
    </form>
  );
}
