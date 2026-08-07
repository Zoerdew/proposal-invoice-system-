"use client";

import { FormEvent, useState } from "react";
import {
  ANNUAL_TURNOVER_OPTIONS,
  BUDGET_FIT_OPTIONS,
  DATA_HISTORY_OPTIONS,
  DATA_STATE_OPTIONS,
  REPEAT_BUSINESS_OPTIONS,
  START_TIMING_OPTIONS,
  TOOLS_USED_OPTIONS,
  WHAT_THEYRE_AFTER_OPTIONS,
} from "@/lib/db/applicationChoices";

const inputClass =
  "w-full rounded-xl border border-brand-ink/15 px-3 py-2 focus:border-brand-pink focus:outline-none bg-white";
const labelClass = "mb-1 block text-sm font-medium text-brand-ink/70";
const sectionClass = "rounded-2xl border border-brand-ink/10 bg-white p-6";

function PillOption({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        selected
          ? "border-brand-pink bg-brand-pink/10 text-brand-pink"
          : "border-brand-ink/20 text-brand-ink/60 hover:border-brand-ink/40"
      }`}
    >
      {label}
    </button>
  );
}

export default function ApplyForm() {
  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [whatBusinessDoes, setWhatBusinessDoes] = useState("");
  const [timeInBusiness, setTimeInBusiness] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");
  const [mainOffersPricing, setMainOffersPricing] = useState("");
  const [topRevenueOffer, setTopRevenueOffer] = useState("");
  const [repeatBusiness, setRepeatBusiness] = useState("");
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [dataHistory, setDataHistory] = useState("");
  const [dataState, setDataState] = useState("");
  const [whatTheyveTried, setWhatTheyveTried] = useState("");
  const [biggestOpportunity, setBiggestOpportunity] = useState("");
  const [slowWeekBehaviour, setSlowWeekBehaviour] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [whatTheyreAfter, setWhatTheyreAfter] = useState("");
  const [opennessToEvidence, setOpennessToEvidence] = useState("");
  const [startTiming, setStartTiming] = useState("");
  const [budgetFit, setBudgetFit] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function toggleTool(tool: string) {
    setToolsUsed((current) =>
      current.includes(tool) ? current.filter((t) => t !== tool) : [...current, tool]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const res = await fetch("/api/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicantName,
        email,
        businessName,
        website,
        whatBusinessDoes,
        timeInBusiness,
        annualTurnover: annualTurnover || undefined,
        mainOffersPricing,
        topRevenueOffer,
        repeatBusiness: repeatBusiness || undefined,
        toolsUsed,
        dataHistory: dataHistory || undefined,
        dataState: dataState || undefined,
        whatTheyveTried,
        biggestOpportunity,
        slowWeekBehaviour,
        whyNow,
        whatTheyreAfter: whatTheyreAfter || undefined,
        opennessToEvidence,
        startTiming: startTiming || undefined,
        budgetFit: budgetFit || undefined,
        anythingElse,
      }),
    });

    if (res.ok) {
      setStatus("done");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong submitting that — try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className={`${sectionClass} text-center`}>
        <h2 className="mb-2 text-xl font-extrabold text-brand-ink">Application received</h2>
        <p className="text-brand-ink/60">
          Thanks — I&apos;ll read this properly and get back to you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className={sectionClass}>
        <h2 className="mb-4 text-lg font-extrabold text-brand-ink">You</h2>
        <div className="mb-4">
          <label className={labelClass}>Your name</label>
          <input
            required
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-4 text-lg font-extrabold text-brand-ink">The business</h2>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Business name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClass}
              placeholder="https://"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>What does the business do?</label>
          <textarea
            rows={3}
            value={whatBusinessDoes}
            onChange={(e) => setWhatBusinessDoes(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Time in business</label>
            <input
              value={timeInBusiness}
              onChange={(e) => setTimeInBusiness(e.target.value)}
              className={inputClass}
              placeholder="e.g. 3 years"
            />
          </div>
          <div>
            <label className={labelClass}>Annual turnover</label>
            <select
              value={annualTurnover}
              onChange={(e) => setAnnualTurnover(e.target.value)}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              {ANNUAL_TURNOVER_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>Main offers &amp; pricing</label>
          <textarea
            rows={3}
            value={mainOffersPricing}
            onChange={(e) => setMainOffersPricing(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="mb-4">
          <label className={labelClass}>Top revenue offer</label>
          <input
            value={topRevenueOffer}
            onChange={(e) => setTopRevenueOffer(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <p className={labelClass}>Repeat business</p>
          <div className="flex flex-wrap gap-2">
            {REPEAT_BUSINESS_OPTIONS.map((o) => (
              <PillOption
                key={o}
                label={o}
                selected={repeatBusiness === o}
                onClick={() => setRepeatBusiness(o)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-4 text-lg font-extrabold text-brand-ink">Data &amp; tools</h2>
        <div className="mb-4">
          <p className={labelClass}>Tools used</p>
          <div className="flex flex-wrap gap-2">
            {TOOLS_USED_OPTIONS.map((o) => (
              <PillOption key={o} label={o} selected={toolsUsed.includes(o)} onClick={() => toggleTool(o)} />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className={labelClass}>How long have you had sales data?</p>
          <div className="flex flex-wrap gap-2">
            {DATA_HISTORY_OPTIONS.map((o) => (
              <PillOption key={o} label={o} selected={dataHistory === o} onClick={() => setDataHistory(o)} />
            ))}
          </div>
        </div>
        <div>
          <p className={labelClass}>What state is your data in?</p>
          <div className="flex flex-wrap gap-2">
            {DATA_STATE_OPTIONS.map((o) => (
              <PillOption key={o} label={o} selected={dataState === o} onClick={() => setDataState(o)} />
            ))}
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-4 text-lg font-extrabold text-brand-ink">The real story</h2>
        <div className="mb-4">
          <label className={labelClass}>What have you already tried?</label>
          <textarea
            rows={3}
            value={whatTheyveTried}
            onChange={(e) => setWhatTheyveTried(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="mb-4">
          <label className={labelClass}>Biggest opportunity you can see</label>
          <textarea
            rows={3}
            value={biggestOpportunity}
            onChange={(e) => setBiggestOpportunity(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="mb-4">
          <label className={labelClass}>What happens on a slow week?</label>
          <textarea
            rows={3}
            value={slowWeekBehaviour}
            onChange={(e) => setSlowWeekBehaviour(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Why now?</label>
          <textarea
            rows={3}
            value={whyNow}
            onChange={(e) => setWhyNow(e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      <section className={sectionClass}>
        <h2 className="mb-4 text-lg font-extrabold text-brand-ink">What you&apos;re after</h2>
        <div className="mb-4">
          <p className={labelClass}>What are you after?</p>
          <div className="flex flex-wrap gap-2">
            {WHAT_THEYRE_AFTER_OPTIONS.map((o) => (
              <PillOption
                key={o}
                label={o}
                selected={whatTheyreAfter === o}
                onClick={() => setWhatTheyreAfter(o)}
              />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className={labelClass}>
            How open are you to evidence changing your mind, and to acting on it?
          </label>
          <textarea
            rows={3}
            value={opennessToEvidence}
            onChange={(e) => setOpennessToEvidence(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="mb-4">
          <p className={labelClass}>When would you want to start?</p>
          <div className="flex flex-wrap gap-2">
            {START_TIMING_OPTIONS.map((o) => (
              <PillOption key={o} label={o} selected={startTiming === o} onClick={() => setStartTiming(o)} />
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className={labelClass}>Does the investment work for you?</p>
          <div className="flex flex-wrap gap-2">
            {BUDGET_FIT_OPTIONS.map((o) => (
              <PillOption key={o} label={o} selected={budgetFit === o} onClick={() => setBudgetFit(o)} />
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Anything else?</label>
          <textarea
            rows={3}
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "submitting" || !applicantName.trim() || !email.trim()}
        className="rounded-full bg-brand-pink px-6 py-3 font-extrabold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-40"
      >
        {status === "submitting" ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}
