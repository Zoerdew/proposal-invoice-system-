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
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0a0608] text-[#FDE047] font-heading font-[800] text-sm shrink-0">
          {number}
        </span>
        <h2 className="font-heading font-[800] text-2xl tracking-[-0.03em]">{children}</h2>
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
          data-active={value === option}
          onClick={() => onChange(option)}
          className="pill-toggle px-4 py-2 text-xs font-heading font-[800] data-[active=false]:border-[#0a0608]/25 data-[active=false]:text-[#0a0608]/60 data-[active=false]:hover:border-[#0a0608]"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const textareaClass = "input-brutal w-full p-4 text-sm leading-relaxed outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream placeholder:text-[#0a0608]/30";
const inputClass = "input-brutal w-full p-3 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream placeholder:text-[#0a0608]/30";
const nestedCardClass = "border-2 border-[#0a0608] rounded-[14px] p-4 bg-cream";

interface OfferRow {
  key: string;
  name: string;
  price: string;
  stillLive: boolean;
  deliveryHours: string;
}

function emptyOfferRow(): OfferRow {
  return { key: crypto.randomUUID(), name: "", price: "", stillLive: true, deliveryHours: "" };
}

interface TimelineRow {
  key: string;
  month: string;
  whatHappened: string;
}

function emptyTimelineRow(): TimelineRow {
  return { key: crypto.randomUUID(), month: "", whatHappened: "" };
}

export default function OnboardingForm({ token }: { token: string }) {
  const router = useRouter();

  const [bestDayForCheckin, setBestDayForCheckin] = useState<CheckinDay | "">("");
  const [whereRevenueDataLives, setWhereRevenueDataLives] = useState<RevenueDataSource | "">("");
  const [programmeStartDate, setProgrammeStartDate] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");
  const [biggestChallengeRightNow, setBiggestChallengeRightNow] = useState("");
  const [whatsGeneratingLeadsNow, setWhatsGeneratingLeadsNow] = useState("");
  const [sixMonthRisk, setSixMonthRisk] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [definitionOfSuccess, setDefinitionOfSuccess] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  const [offers, setOffers] = useState<OfferRow[]>([emptyOfferRow()]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([emptyTimelineRow()]);

  const [paymentProcessors, setPaymentProcessors] = useState("");
  const [emailPlatform, setEmailPlatform] = useState("");
  const [subscriberCount, setSubscriberCount] = useState("");
  const [whereEnquiriesLive, setWhereEnquiriesLive] = useState("");
  const [analyticsAccess, setAnalyticsAccess] = useState("");

  const [offTheTable, setOffTheTable] = useState("");
  const [whatTheyveTriedAndRuledOut, setWhatTheyveTriedAndRuledOut] = useState("");
  const [ownTheory, setOwnTheory] = useState("");

  const [files, setFiles] = useState<File[]>([]);

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  const canSubmit = Boolean(bestDayForCheckin && whereRevenueDataLives);

  function updateOffer(key: string, patch: Partial<OfferRow>) {
    setOffers((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function updateTimelineRow(key: string, patch: Partial<TimelineRow>) {
    setTimeline((current) => current.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

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
        annualTurnover: Number(annualTurnover),
        biggestChallengeRightNow,
        whatsGeneratingLeadsNow,
        sixMonthRisk,
        whyNow,
        definitionOfSuccess,
        anythingElse,
        paymentProcessors,
        emailPlatform,
        subscriberCount: subscriberCount.trim() ? Number(subscriberCount) : undefined,
        whereEnquiriesLive,
        analyticsAccess,
        offTheTable,
        whatTheyveTriedAndRuledOut,
        ownTheory,
        offers: offers
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name,
            price: o.price.trim() ? Number(o.price) : undefined,
            stillLive: o.stillLive,
            deliveryHours: o.deliveryHours.trim() ? Number(o.deliveryHours) : undefined,
          })),
        timeline: timeline
          .filter((t) => t.month && t.whatHappened.trim())
          .map((t) => ({ month: t.month, whatHappened: t.whatHappened })),
      }),
    });

    if (!res.ok) {
      setStatus("error");
      return;
    }

    if (files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        // Best-effort: onboarding itself is already saved by this point, a
        // failed upload shouldn't block completing onboarding.
        await fetch(`/api/onboarding/${token}/upload`, { method: "POST", body: formData }).catch(
          () => undefined
        );
      }
    }

    router.push(`/c/${token}/snapshot`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <section className="card-brutal mb-10 p-8">
        <SectionHeading number="01" subhead="The honest baseline — no polish needed.">
          Where you are
        </SectionHeading>

        <div className="mb-10">
          <FieldLabel htmlFor="annualTurnover">Annual turnover</FieldLabel>
          <div className="input-brutal flex items-center px-4 focus-within:shadow-[3px_3px_0_#F11787] transition-shadow max-w-xs">
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
              className="w-full bg-transparent py-3 text-2xl font-heading font-[800] outline-none placeholder:text-[#0a0608]/20"
            />
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

      <section className="card-brutal-blush mb-10 p-8">
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
            className="input-brutal py-3 px-4 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream max-w-xs"
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

      <section className="card-brutal mb-10 p-8">
        <SectionHeading number="03" subhead="Every offer, even the ones you don't push anymore.">
          Your offers
        </SectionHeading>

        {offers.map((row, i) => (
          <div key={row.key} className={`mb-6 ${nestedCardClass}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-[#0a0608]/40 font-heading font-[800]">
                Offer {i + 1}
              </p>
              {offers.length > 1 && (
                <button
                  type="button"
                  onClick={() => setOffers((current) => current.filter((r) => r.key !== row.key))}
                  className="text-xs text-[#0a0608]/40 hover:text-[#F11787]"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="mb-3">
              <FieldLabel htmlFor={`offer-name-${row.key}`}>Name</FieldLabel>
              <input
                id={`offer-name-${row.key}`}
                value={row.name}
                onChange={(e) => updateOffer(row.key, { name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor={`offer-price-${row.key}`}>Price</FieldLabel>
                <input
                  id={`offer-price-${row.key}`}
                  type="number"
                  step="0.01"
                  value={row.price}
                  onChange={(e) => updateOffer(row.key, { price: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor={`offer-hours-${row.key}`}>Rough delivery hours per sale</FieldLabel>
                <input
                  id={`offer-hours-${row.key}`}
                  type="number"
                  step="0.5"
                  value={row.deliveryHours}
                  onChange={(e) => updateOffer(row.key, { deliveryHours: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-[#0a0608]/60">
              <input
                type="checkbox"
                checked={row.stillLive}
                onChange={(e) => updateOffer(row.key, { stillLive: e.target.checked })}
                className="w-4 h-4 accent-[#F11787]"
              />
              Still live
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOffers((current) => [...current, emptyOfferRow()])}
          className="text-sm font-heading font-[800] text-[#0a0608] hover:text-[#F11787]"
        >
          + Add another offer
        </button>
      </section>

      <section className="card-brutal-blush mb-10 p-8">
        <SectionHeading
          number="04"
          subhead="Launches, ads on and off, price changes, a podcast, a holiday, a slow spell — anything that moved the needle."
        >
          The last 12 months, month by month
        </SectionHeading>

        {timeline.map((row, i) => (
          <div key={row.key} className="mb-4 flex gap-3">
            <input
              type="month"
              value={row.month ? row.month.slice(0, 7) : ""}
              onChange={(e) =>
                updateTimelineRow(row.key, { month: e.target.value ? `${e.target.value}-01` : "" })
              }
              className="input-brutal w-40 shrink-0 p-2 text-sm outline-none focus:shadow-[3px_3px_0_#F11787] transition-shadow bg-cream"
            />
            <input
              value={row.whatHappened}
              onChange={(e) => updateTimelineRow(row.key, { whatHappened: e.target.value })}
              placeholder="What happened"
              className={inputClass}
            />
            {timeline.length > 1 && (
              <button
                type="button"
                onClick={() => setTimeline((current) => current.filter((r) => r.key !== row.key))}
                className="shrink-0 text-[#0a0608]/40 hover:text-[#F11787]"
                aria-label={`Remove month ${i + 1}`}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setTimeline((current) => [...current, emptyTimelineRow()])}
          className="text-sm font-heading font-[800] text-[#0a0608] hover:text-[#F11787]"
        >
          + Add a month
        </button>
      </section>

      <section className="card-brutal mb-10 p-8">
        <SectionHeading number="05" subhead="So there's no back-and-forth chasing access later.">
          Where things live
        </SectionHeading>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="paymentProcessors">Payment processors</FieldLabel>
            <input
              id="paymentProcessors"
              value={paymentProcessors}
              onChange={(e) => setPaymentProcessors(e.target.value)}
              className={inputClass}
              placeholder="e.g. Stripe, PayPal"
            />
          </div>
          <div>
            <FieldLabel htmlFor="emailPlatform">Email platform</FieldLabel>
            <input
              id="emailPlatform"
              value={emailPlatform}
              onChange={(e) => setEmailPlatform(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="subscriberCount">Subscriber count</FieldLabel>
            <input
              id="subscriberCount"
              type="number"
              value={subscriberCount}
              onChange={(e) => setSubscriberCount(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="whereEnquiriesLive">Where enquiries live</FieldLabel>
            <input
              id="whereEnquiriesLive"
              value={whereEnquiriesLive}
              onChange={(e) => setWhereEnquiriesLive(e.target.value)}
              className={inputClass}
              placeholder="e.g. inbox, DMs, a form"
            />
          </div>
        </div>
        <div className="mb-8">
          <FieldLabel htmlFor="analyticsAccess">Analytics access</FieldLabel>
          <input
            id="analyticsAccess"
            value={analyticsAccess}
            onChange={(e) => setAnalyticsAccess(e.target.value)}
            className={inputClass}
            placeholder="e.g. Google Analytics, or none set up"
          />
        </div>

        <div>
          <FieldLabel htmlFor="files">Upload any exports you already have</FieldLabel>
          <input
            id="files"
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
            className="text-sm text-[#0a0608]/70"
          />
        </div>
      </section>

      <section className="card-brutal-blush mb-10 p-8">
        <SectionHeading number="06" subhead="So the plan works around real constraints, not guessed ones.">
          What&apos;s off the table
        </SectionHeading>

        <div className="mb-8">
          <QuestionLabel htmlFor="offTheTable">
            Anything not up for discussion right now — no ads, no new offer, no more delivery
            hours?
          </QuestionLabel>
          <textarea
            id="offTheTable"
            rows={3}
            value={offTheTable}
            onChange={(e) => setOffTheTable(e.target.value)}
            className={textareaClass}
          />
        </div>

        <div className="mb-8">
          <QuestionLabel htmlFor="whatTheyveTriedAndRuledOut">
            What have you already tried and ruled out?
          </QuestionLabel>
          <textarea
            id="whatTheyveTriedAndRuledOut"
            rows={3}
            value={whatTheyveTriedAndRuledOut}
            onChange={(e) => setWhatTheyveTriedAndRuledOut(e.target.value)}
            className={textareaClass}
          />
        </div>

        <div>
          <QuestionLabel htmlFor="ownTheory">
            What&apos;s your own theory about what&apos;s causing it?
          </QuestionLabel>
          <textarea
            id="ownTheory"
            rows={3}
            value={ownTheory}
            onChange={(e) => setOwnTheory(e.target.value)}
            className={textareaClass}
          />
        </div>
      </section>

      <section className="card-brutal mb-10 p-8">
        <SectionHeading
          number="07"
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
        className="btn-pill px-8 py-4 text-sm"
      >
        {status === "submitting" ? "Submitting..." : "Complete onboarding"}
      </button>
    </form>
  );
}
