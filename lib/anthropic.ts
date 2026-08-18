import { TESTIMONIALS } from "./callProposalFixedContent";
import { assembleCallProposalHtml } from "./callProposalTemplate";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Low-volume, high-stakes: one of these gets built per real sales call, not
// in bulk, and it's the actual document a prospect reads to decide whether
// to buy. Worth the better model over Sonnet — swap the constant below if
// cost becomes a concern.
const MODEL = "claude-opus-5";
const MAX_TOKENS = 8000;

// Verbatim content/copy rules supplied by Zoë for the call-transcript
// proposal generator (V2-BUILD-SPEC.md Phase 11), adapted to a structured
// JSON contract (Aug 2026) instead of raw HTML — the design/layout is now
// a real template (lib/callProposalTemplate.ts) the AI's output gets
// slotted into, rather than something it improvises from a description
// each time. See that file for why: a hand-tuned Bento-style template
// consistently looks better than an LLM re-deriving the same CSS system
// from a paragraph on every generation.
const SYSTEM_PROMPT = `You are writing the content for a private, one-off proposal page for one specific prospect, built entirely from a call transcript. This is not a generic sales page. It is a decision document for one named person, built from what they actually said. You do not write any HTML or CSS — only the JSON content described at the end of this prompt. A template already handles every visual detail.

Before you write anything

Read the full transcript first. Pull out, in your own working notes, only what was actually said:

- The prospect's situation: their business, their numbers (revenue, list size, pricing, whatever they stated), what they've tried, what isn't working, in their own words and figures.
- What they said they want, including anything vague or half-formed.
- Any worries or objections they raised.
- Whether pricing or package options were discussed live on the call. This determines everything about the Investment section (see below).
- Any specific commitment Zoë made on the call: a discount, a number of spaces, a start date, a payment structure. These override any default.
- A start date, if one was agreed or even loosely mentioned ("early September"). If only a rough window was given, pick one reasonable Monday inside that window.

If the transcript does not make clear whether pricing was discussed live, or what currency the prospect operates in, stop and ask before generating anything. Do not guess.

The rule that overrides everything else

Every specific has to trace back to something the prospect or Zoë actually said on the call. No invented numbers, no invented scenes, no generic credibility stack, no manufactured urgency beyond a deadline or capacity limit that is actually true right now. If you don't have a real detail for a section, write the section plainer rather than filling the gap with something invented. This also governs the testimonial pool below: you may only select from it, never write your own line even in that style.

What this engagement is called

Always call it a 90-day one-to-one strategic partnership. Never "the six-call programme," "the six-call system," or similar — the six calls are the mechanism inside the 90 days, not the name of the thing itself. The word "programme" should not appear as the name of the engagement.

Spread the detail out, don't repeat it

A real transcript gives you far more raw material than any single section needs — the prospect's numbers, what they've tried, their worries, specific phrases they used, what Zoë noticed, any tangents that revealed something real. Draw on different parts of it for different sections. If the Recap, Scope, Investment, and Next steps all end up leaning on the same two or three facts restated in different words, that's a sign you've under-used the transcript, not that there wasn't enough material — go back and pull more out before you write. Deliverables within Scope in particular should each reference something distinct, not the same underlying problem restated six ways.

Content, section by section

Masthead. \`titleLine1\` and \`titleEmphasis\` together form a two-line headline naming the outcome, in the prospect's own language, not a category description. \`subtitle\` is one confident sentence expanding on it. Do not describe what the page itself is or why it exists.

Recap (\`recapLede\`, \`recapPara1\`, \`recapPara2\`, \`recapGoals\`, \`recapQuote\`, \`recapQuoteCaption\`). The lede restates the situation in two sentences. The two paragraphs recap what's working and what's straining, in Zoë's voice, not the prospect's words quoted back — an accurate recap that shows she was listening, no advice yet. 2-4 goals, in the prospect's own words. One real, verbatim quote actually said on the call that captures why this matters to them (never paraphrased into something punchier), with a caption in the form "Name · Discovery Call, [date]".

Recommendation (\`offerName\`, \`planBody\`). Name the actual offer or package. 2-3 sentences at altitude: the approach, why this shape fits, the outcome it points at. Details live in Scope below; this is the confident summary.

Scope (\`scopePhases\`, \`notIncluded\`). Organise the 90 days into 2-3 phase groups with 3-6 deliverable rows each. The mechanism underneath, always exactly six calls, never seven: a 90 minute kickoff (not a joint discovery session — this is where Zoë walks the prospect through reports she has already prepared), then five 60 minute calls one every other week, following her five-stage method in this order: Find (identify where untapped revenue and opportunities already exist), Focus (prioritise by return, decide what deserves attention first), Fix (remove bottlenecks, implement the highest-impact improvements), Fortify (embed the changes so they're repeatable without constant intervention), Future (plan the next six to twelve months — the final call, not a lead-in to a further one). A natural grouping is kickoff+Find+Focus as one phase, Fix+Fortify as a second, Future as a third, but adjust to whatever reads best. Describe each deliverable in terms of what it means for this specific prospect's problem, not in the abstract. Tag each row "Deliverable" or "Session". \`notIncluded\` lists what this engagement deliberately does not cover, so expectations stay clean — invent nothing here either; only include something if it's a genuine adjacent thing that came up or is obviously implied (e.g. paid ads management if the call was about organic).

Investment (\`investmentVariant\`, \`investmentSingle\` or \`investmentTiers\`, \`investmentNote\`). This branches:

- If specific pricing or package options were discussed live on the call, use exactly those options, those numbers, and nothing else. Do not add a third option, a deposit, or a payment plan that wasn't part of that conversation. If more than one option was discussed, use \`investmentTiers\` with exactly those options, matching the wording used on the call as closely as possible.
- If pricing was not discussed live, use the current standard offer terms and current live discount window and capacity supplied in the user message (never hardcoded — those change over time). Falling Forwards standard pricing is always quoted exclusive of VAT — state it as the amount plus VAT (e.g. "£3,300 + VAT"), not as a conditional "if UK." State plainly whether a time-limited discount currently applies and its real deadline, and current capacity if that's genuinely limited right now.
- Do not introduce a deposit-to-hold-your-place mechanic unless it was specifically discussed on the call for this prospect.
- Show instalment figures as actual division of the total (total divided by 3, correctly rounded), never a vague "instalments available" without the number.

Next steps (\`replyAside\`). A short, personal line referencing something specific from the call, prompting them to reply with the start date they want. Do not promise to send an onboarding form, and do not ask them to state a payment plan preference in their reply — the separate signable proposal (sent after this) is where they choose how to pay, not this page.

Timeline (\`startDate\`). An ISO date (YYYY-MM-DD) if a start date was agreed or reasonably inferred per the instructions above, otherwise null. This is the only date-related field — the actual timeline card copy is generated by code from Zoë's fixed method, not by you.

Testimonials (\`testimonialIndices\`). You'll be given a numbered pool of Zoë's real testimonials in the user message, each with a business/context tag. Pick 0-2 indices that best fit this prospect's situation or industry. Leave the array empty if none fit — never force one.

Copy rules, always

No em dashes. No smart quotes or curly apostrophes. No false-contrast constructions ("it's not X, it's Y"). No fake urgency or scarcity that isn't real and current. No rule-of-three rhetorical rhythm. Never use "actually," "literally," "genuinely," or "quietly" as filler. Never use "just" to describe effort or execution. British spelling throughout. No unprompted disclaimers, no coach-voice motivational language, no hedging. Plain, direct, specific sentences, varied length, no listicle cadence.

Output

Respond with only a JSON object, no other text, no markdown code fence, in exactly this shape:

{
  "titleLine1": "...", "titleEmphasis": "...", "subtitle": "...",
  "recapLede": "...", "recapPara1": "...", "recapPara2": "...",
  "recapGoals": ["...", "..."],
  "recapQuote": "...", "recapQuoteCaption": "...",
  "offerName": "...", "planBody": "...",
  "scopePhases": [{ "name": "...", "deliverables": [{ "label": "...", "desc": "...", "tag": "Deliverable" }] }],
  "notIncluded": ["..."],
  "investmentVariant": "single",
  "investmentSingle": { "label": "...", "amount": "...", "terms": "...", "includes": ["..."], "note": "..." },
  "investmentTiers": null,
  "investmentNote": "...",
  "replyAside": "...",
  "testimonialIndices": [0],
  "startDate": "2026-09-01"
}

When \`investmentVariant\` is "tiers", omit \`investmentSingle\` (or set it null) and set \`investmentTiers\` to an array of { "name", "price", "features": ["..."], "bestFor", "featured": true|false }, exactly one of which has "featured": true.`;

export interface CallProposalGenerationInput {
  prospectName: string;
  callDate: string | null;
  currency: string;
  transcript: string;
  // Manual input, typed in fresh each time rather than stored on `offers` —
  // the live discount window/capacity changes too often to be worth a
  // dedicated schema field (Zoë's call, Phase 11). Only matters when the
  // transcript shows pricing wasn't discussed live; the system prompt's
  // Investment section branches on that.
  pricingContext?: string;
}

// Strips a leading/trailing ```json fence defensively — the prompt says
// "no markdown code fence", but models sometimes wrap output anyway.
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:\w+)?\n([\s\S]*)\n```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function generateCallProposalHtml(
  input: CallProposalGenerationInput
): Promise<string> {
  const testimonialPool = TESTIMONIALS.map(
    (t, i) => `${i}. "${t.quote}" — ${t.clientName}, ${t.clientBusiness}${t.context ? ` (${t.context})` : ""}`
  ).join("\n");

  const userMessage = [
    `Prospect name: ${input.prospectName}`,
    `Call date: ${input.callDate ?? "not given"}`,
    `Currency: ${input.currency}`,
    ...(input.pricingContext?.trim()
      ? [
          "",
          "Current standard offer terms / live discount window / capacity (use only if the transcript shows pricing was NOT discussed live on the call):",
          input.pricingContext.trim(),
        ]
      : []),
    "",
    "Testimonial pool (pick by index, or none):",
    testimonialPool || "(none supplied)",
    "",
    "Transcript:",
    input.transcript,
  ].join("\n");

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": requireEnv("ANTHROPIC_API_KEY"),
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic API returned no text content");
  }

  const parsed = JSON.parse(stripCodeFence(textBlock.text));

  const callDate = input.callDate ?? null;
  const validThrough = addDaysIso(callDate ?? new Date().toISOString().slice(0, 10), 21);

  return assembleCallProposalHtml(parsed, {
    prospectName: input.prospectName,
    callDate,
    validThrough,
  });
}

// Phase 12: turning a matched meeting-note transcript into a summary +
// to-do list. Plain structured extraction, not persuasive copy — Sonnet
// is the right call here over the Opus default used for call proposals.
const EXTRACTION_MODEL = "claude-sonnet-5";
const EXTRACTION_MAX_TOKENS = 2000;

const EXTRACTION_SYSTEM_PROMPT = `You are extracting a short summary and a to-do list from the raw text of a client call transcript or meeting notes document, for a business coaching client portal.

Only include to-dos that were actually agreed or committed to in the document — either the client committing to do something, or an action item explicitly assigned to the client. Do not invent to-dos that weren't discussed. If there are none, return an empty list.

Respond with only a JSON object, no other text, in exactly this shape:
{"summary": "one or two sentence plain-language summary of the call", "todos": ["first to-do", "second to-do"]}`;

export interface MeetingNotesExtraction {
  summary: string;
  todos: string[];
}

export async function extractMeetingNotesSummaryAndTodos(
  rawContent: string
): Promise<MeetingNotesExtraction> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": requireEnv("ANTHROPIC_API_KEY"),
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      max_tokens: EXTRACTION_MAX_TOKENS,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawContent }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic API returned no text content");
  }

  const parsed = JSON.parse(stripCodeFence(textBlock.text)) as {
    summary?: unknown;
    todos?: unknown;
  };
  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  const todos = Array.isArray(parsed.todos)
    ? parsed.todos.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  return { summary, todos };
}

// Phase 16 (V3-BUILD-SPEC.md): the richer detail a public call-recap page
// needs beyond Phase 12's summary/todos — decisions reached and a
// topic-by-topic breakdown, mirroring the real structure Google's own
// Gemini notes already produce (Summary/Decisions/Next steps/Details),
// not inventing a new shape. Deliberately doesn't re-derive next-steps —
// those already exist as real todos from Phase 12's ingestion. Does
// produce its own short-version summary (shortVersion) rather than
// reusing meeting_notes.summary — that field is Phase 12's admin-facing
// extraction, third person for Zoë's own notes, wrong voice for a page
// the client reads themselves.
const RECAP_DETAILS_SYSTEM_PROMPT = `You are extracting structured detail from the raw text of a client call transcript or meeting notes document, for a call-recap page the client themselves will read afterwards.

Write everything in second person, addressed directly to the client — "you decided," "we covered," "your next step" — never third person ("the client," their name as a subject repeated throughout). This is a page written to them, not a report about them.

Short version: two or three sentences summarising what the call covered and where it landed, in second person.

Focus: a short three-to-six word phrase naming what the call was mainly about (e.g. "Customer segmentation and win-back strategy"). Plain, specific, not a generic label.

Decisions: only things that were actually agreed or decided on the call, stated plainly in one sentence each, second person where it applies ("you'll..." / "we agreed..."). Do not include a decision that wasn't actually reached — if nothing was decided, return an empty list.

Details: a short, topic-by-topic breakdown of what was substantively discussed, grouped into 2-5 topics. Each needs a short one or two word label (e.g. "PRICING", "SEGMENTS"), a specific title naming the actual topic, and a body paragraph in plain language covering what was actually said, second person, not generic advice. Ground every specific in what's actually in the document — no invented numbers or details.

Respond with only a JSON object, no other text, in exactly this shape:
{"shortVersion": "...", "focus": "...", "decisions": ["first decision", "second decision"], "details": [{"label": "TOPIC", "title": "Specific title", "body": "Paragraph covering what was discussed."}]}`;

export interface CallRecapDetails {
  shortVersion: string;
  focus: string;
  decisions: string[];
  details: { label: string; title: string; body: string }[];
}

export async function extractCallRecapDetails(rawContent: string): Promise<CallRecapDetails> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": requireEnv("ANTHROPIC_API_KEY"),
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: EXTRACTION_MODEL,
      max_tokens: 4000,
      system: RECAP_DETAILS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: rawContent }],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const textBlock = data.content.find((block) => block.type === "text");
  if (!textBlock?.text) {
    throw new Error("Anthropic API returned no text content");
  }

  const parsed = JSON.parse(stripCodeFence(textBlock.text)) as {
    shortVersion?: unknown;
    focus?: unknown;
    decisions?: unknown;
    details?: unknown;
  };
  const shortVersion = typeof parsed.shortVersion === "string" ? parsed.shortVersion : "";
  const focus = typeof parsed.focus === "string" ? parsed.focus : "";
  const decisions = Array.isArray(parsed.decisions)
    ? parsed.decisions.filter((d): d is string => typeof d === "string" && d.trim().length > 0)
    : [];
  const details = Array.isArray(parsed.details)
    ? parsed.details.filter(
        (d): d is { label: string; title: string; body: string } =>
          typeof d === "object" &&
          d !== null &&
          typeof (d as { label?: unknown }).label === "string" &&
          typeof (d as { title?: unknown }).title === "string" &&
          typeof (d as { body?: unknown }).body === "string"
      )
    : [];

  return { shortVersion, focus, decisions, details };
}
