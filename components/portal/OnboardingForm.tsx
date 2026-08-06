"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CheckinDay, RevenueDataSource } from "@/lib/db/clients";

const CHECKIN_DAYS: CheckinDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];
const REVENUE_SOURCES: RevenueDataSource[] = [
  "Stripe",
  "Other platform",
  "They'll send me reports",
];

function SectionHeading({
  number,
  subhead,
  children,
}: {
  number: string;
  subhead: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-heading font-[800] text-sm text-[#F11787]">{number}</span>
        <h2 className="font-heading font-[800] text-2xl">{children}</h2>
      </div>
      <p className="text-sm text-[#0a0608]/50 max-w-sm">{subhead}</p>
    </div>
  );
}

// For the real narrative questions — these deserve more presence than a
// grey form-field label, since they're the actual prompt being answered.
function QuestionLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="block font-heading font-[600] text-lg leading-snug mb-3" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

// For compact, structured fields (amounts, dates) — utilitarian on purpose.
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-[#0a0608]/60 mb-2" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function OptionalTag() {
  return <span className="normal-case text-[#0a0608]/35 font-heading font-[400]"> (optional)</span>;
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-3.5 py-1.5 rounded-full text-xs border transition-colors ${
            value === option
              ? "border-[#F11787] bg-[#F11787]/10 text-[#F11787]"
              : "border-[#0a0608]/20 text-[#0a0608]/60 hover:border-[#0a0608]/40"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const textareaClass =
  "w-full border border-[#0a0608]/20 rounded-md p-4 text-sm leading-relaxed outline-none focus:border-[#0a0608] bg-transparent placeholder:text-[#0a0608]/30";

export default function OnboardingForm({ token }: { token: string }) {
  const router = useRouter();

  const [bestDayForCheckin, setBestDayForCheckin] = useState<CheckinDay | "">("");
  const [whereRevenueDataLives, setWhereRevenueDataLives] = useState<RevenueDataSource | "">("");
  const [programmeStartDate, setProgrammeStartDate] = useState("");
  const [baselineMonthlyRevenue, setBaselineMonthlyRevenue] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");
  const [biggestChallengeRightNow, setBiggestChallengeRightNow] = useState("");
  const [whatsGeneratingLeadsNow, setWhatsGeneratingLeadsNow] = useState("");
  const [sixMonthRisk, setSixMonthRisk] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [definitionOfSuccess, setDefinitionOfSuccess] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const canSubmit = Boolean(bestDayForCheckin && whereRevenueDataLives);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus("submitting");

    const res = await fetch(`/api/onboarding/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bestDayForCheckin,
        whereRevenueDataLives,
        programmeStartDate,
        baselineMonthlyRevenue: Number(baselineMonthlyRevenue),
        annualTurnover: Number(annualTurnover),
        biggestChallengeRightNow,
        whatsGeneratingLeadsNow,
        sixMonthRisk,
        whyNow,
        definitionOfSuccess,
        anythingElse,
      }),
    });

    if (res.ok) {
      router.push(`/c/${token}/snapshot`);
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <section className="mb-16">
        <SectionHeading number="01" subhead="The honest baseline — no polish needed.">
          Where you are
        </SectionHeading>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <FieldLabel htmlFor="baselineMonthlyRevenue">Baseline monthly revenue</FieldLabel>
            <div className="flex items-center border-b border-[#0a0608]/20 focus-within:border-[#0a0608]">
              <span className="text-2xl font-heading font-[800] mr-1">£</span>
              <input
                id="baselineMonthlyRevenue"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                required
                value={baselineMonthlyRevenue}
                onChange={(e) => setBaselineMonthlyRevenue(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent py-2 text-2xl font-heading font-[800] outline-none placeholder:text-[#0a0608]/20"
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="annualTurnover">Annual turnover</FieldLabel>
            <div className="flex items-center border-b border-[#0a0608]/20 focus-within:border-[#0a0608]">
              <span className="text-2xl font-heading font-[800] mr-1">£</span>
              <input
                id="annualTurnover"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                required
                value={annualTurnover}
                onChange={(e) => setAnnualTurnover(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent py-2 text-2xl font-heading font-[800] outline-none placeholder:text-[#0a0608]/20"
              />
            </div>
          </div>
        </div>

        <div className="mb-8">
          <QuestionLabel htmlFor="biggestChallenge">
            Tell me about the last sale that should have happened but didn&apos;t.
            What happened?
          </QuestionLabel>
          <textarea
            id="biggestChallenge"
            required
            rows={4}
            value={biggestChallengeRightNow}
            onChange={(e) => setBiggestChallengeRightNow(e.target.value)}
            className={textareaClass}
          />
        </div>

        <div className="mb-8">
          <QuestionLabel htmlFor="leadsNow">What&apos;s generating leads now?</QuestionLabel>
          <textarea
            id="leadsNow"
            required
            rows={4}
            value={whatsGeneratingLeadsNow}
            onChange={(e) => setWhatsGeneratingLeadsNow(e.target.value)}
            className={textareaClass}
          />
        </div>

        <div>
          <QuestionLabel htmlFor="sixMonthRisk">
            If nothing changes here, what does the next six months look like?
          </QuestionLabel>
          <textarea
            id="sixMonthRisk"
            required
            rows={4}
            value={sixMonthRisk}
            onChange={(e) => setSixMonthRisk(e.target.value)}
            className={textareaClass}
          />
        </div>
      </section>

      <section className="mb-16 pt-16 border-t border-[#0a0608]/10">
        <SectionHeading
          number="02"
          subhead="What needs to be true for this to have been worth it."
        >
          Where you want to be
        </SectionHeading>

        <div className="mb-8">
          <FieldLabel htmlFor="programmeStartDate">Programme start date</FieldLabel>
          <input
            id="programmeStartDate"
            type="date"
            required
            value={programmeStartDate}
            onChange={(e) => setProgrammeStartDate(e.target.value)}
            className="border-b border-[#0a0608]/20 py-2 text-sm outline-none focus:border-[#0a0608] bg-transparent max-w-xs"
          />
        </div>

        <div className="mb-8">
          <QuestionLabel htmlFor="whyNow">Why now?</QuestionLabel>
          <textarea
            id="whyNow"
            required
            rows={4}
            value={whyNow}
            onChange={(e) => setWhyNow(e.target.value)}
            className={textareaClass}
          />
        </div>

        <div>
          <QuestionLabel htmlFor="definitionOfSuccess">
            How will you know this worked?
            <OptionalTag />
          </QuestionLabel>
          <textarea
            id="definitionOfSuccess"
            rows={4}
            value={definitionOfSuccess}
            onChange={(e) => setDefinitionOfSuccess(e.target.value)}
            className={textareaClass}
          />
        </div>
      </section>

      <section className="mb-12 pt-16 border-t border-[#0a0608]/10">
        <SectionHeading
          number="03"
          subhead="The practical bits, so nothing falls through the cracks."
        >
          How this runs
        </SectionHeading>

        <div className="mb-8">
          <p className="text-sm text-[#0a0608]/60 mb-3">Best day for check-in</p>
          <PillGroup options={CHECKIN_DAYS} value={bestDayForCheckin} onChange={setBestDayForCheckin} />
        </div>

        <div className="mb-8">
          <p className="text-sm text-[#0a0608]/60 mb-3">Where does your revenue data live?</p>
          <PillGroup
            options={REVENUE_SOURCES}
            value={whereRevenueDataLives}
            onChange={setWhereRevenueDataLives}
          />
        </div>

        <div>
          <QuestionLabel htmlFor="anythingElse">
            Anything I haven&apos;t asked that I should know?
            <OptionalTag />
          </QuestionLabel>
          <textarea
            id="anythingElse"
            rows={4}
            value={anythingElse}
            onChange={(e) => setAnythingElse(e.target.value)}
            className={textareaClass}
          />
        </div>
      </section>

      {status === "error" && (
        <p className="text-sm text-red-600 mb-4">
          Something went wrong submitting that — try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !canSubmit}
        className="bg-[#0a0608] text-[#FAF3E9] text-sm tracking-wide uppercase px-6 py-3 rounded-md disabled:opacity-40 transition-opacity"
      >
        {status === "submitting" ? "Submitting..." : "Complete onboarding"}
      </button>
    </form>
  );
}
