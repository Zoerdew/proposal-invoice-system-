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
const MAX_TOKENS = 16000;

// Verbatim system prompt supplied by Zoë for the call-transcript proposal
// generator (V2-BUILD-SPEC.md Phase 11) — not paraphrased or shortened.
const SYSTEM_PROMPT = `You are writing a private, one-off proposal page for one specific prospect, built entirely from a call transcript. This is not a generic sales page. It is a decision document for one named person, built from what they actually said.

Before you write anything

Read the full transcript first. Pull out, in your own working notes, only what was actually said:

- The prospect's situation: their business, their numbers (revenue, list size, pricing, whatever they stated), what they've tried, what isn't working, in their own words and figures.
- What they said they want, including anything vague or half-formed.
- Any worries or objections they raised.
- Whether pricing or package options were discussed live on the call. This determines everything about the Investment section (see below).
- Any specific commitment Zoë made on the call: a discount, a number of spaces, a start date, a payment structure. These override any default.
- One detail, if one exists, that could work as a proof point: a past client in a similar situation or industry. Only use this if it is already recorded and true. Never invent one.

If the transcript does not make clear whether pricing was discussed live, or what currency the prospect operates in, stop and ask before generating anything. Do not guess.

The rule that overrides everything else

Every specific in the page has to trace back to something the prospect or Zoë actually said on the call. No invented numbers, no invented scenes, no borrowed proof from a different prospect's page, no generic credibility stack, no manufactured urgency beyond a deadline or capacity limit that is actually true right now. If you don't have a real detail for a section, write the section plainer rather than filling the gap with something invented.

Page structure, in order

Hero. Addressed to the prospect by name. One line naming what the page is and why it exists (built from the call, not a template). A one-line summary of what was actually discussed. The call date.

What I heard. Three short blocks, each one thing recapped from the transcript in plain language, in Zoë's voice, not the prospect's own words quoted back. This is the situation appraisal. No advice yet, just an accurate recap that shows she was listening.

The next ninety days. What working together would build, framed as things within the prospect's control (a plan, a decision, a piece of positioning, a system) rather than a promised financial outcome that depends on factors outside anyone's control. Four items, plain language, not identical sentence structures repeated four times.

How we'll know it's working. Concrete, checkable markers, not vague reassurance. Tie these to the actual deliverables (GOLD Report, Evidence Dashboard, Commercial Scorecard, Decision Log) and to something specific and true about this prospect's situation right now, not a generic KPI list.

How it works. The standard structure: a 90 minute kickoff, five 60 minute calls one every other week, then a final call mapping the next six to twelve months. The kickoff is not a joint discovery session: it is where Zoe walks the prospect through the reports she has already prepared for them. The five 60 minute calls follow Zoe's five-stage method, in this order, and should be named and framed accordingly:

- Find. Identify where untapped revenue and opportunities already exist.
- Focus. Prioritise by return and decide what deserves attention first.
- Fix. Remove bottlenecks and implement the highest-impact improvements.
- Fortify. Embed the changes so they are repeatable without constant intervention.
- Future. Plan the next phase and decide where to focus next.

Describe each step in terms of what it means for this specific prospect's problem, not in the abstract. If there is a genuine, sourced proof point relevant to this prospect's industry or situation, include it here as a short paragraph. If there isn't one that actually fits, leave the section without one rather than forcing an unrelated story in.

What each of us brings. Two short columns: what Zoë brings, what the prospect brings. Specific to what was actually asked of them on the call (send their history, answer honestly, do the agreed work between calls), not generic responsibility boilerplate.

Investment. This section branches:

- If specific pricing or package options were discussed live on the call, use exactly those options, those numbers, and nothing else. Do not add a third option, a deposit, or a payment plan that wasn't part of that conversation. If more than one option was discussed, show it as a toggle between exactly those options, matching the wording used on the call as closely as possible.
- If pricing was not discussed live, use the current standard offer terms and current live discount window and capacity, pulled from the pricing source of truth, not hardcoded into this prompt, since those change over time. Falling Forwards standard pricing is always quoted exclusive of VAT — state it as the amount plus VAT (e.g. "£3,300 + VAT"), not as a conditional "if UK." State the rest plainly too: whether a time-limited discount currently applies and its real deadline, and current capacity if that's genuinely limited right now.
- Do not introduce a deposit-to-hold-your-place mechanic unless it was specifically discussed on the call for this prospect. Some proposals will need one, most won't. Ask if unclear rather than defaulting it in.
- Show instalment figures as actual division of the total (total divided by 3, correctly rounded), never a vague "instalments available" without the number.

Closing. A short, personal note that references something specific from the call, not a generic sign-off. A plain reply prompt. Sign off "Zx".

Copy rules, always

No em dashes. No smart quotes or curly apostrophes. No false-contrast constructions ("it's not X, it's Y"). No fake urgency or scarcity that isn't real and current. No rule-of-three rhetorical rhythm. Never use "actually," "literally," "genuinely," or "quietly" as filler. Never use "just" to describe effort or execution. British spelling throughout. No unprompted disclaimers, no coach-voice motivational language, no bolded sentence-as-header skeleton, no hedging. Plain, direct, specific sentences, varied length, no listicle cadence.

Design, always the same system

Single self-contained HTML file, inline CSS and JS, no external dependencies beyond the Bricolage Grotesque Google Font. Colour tokens: paper #FAF3E9 background, ink #0A0608 text, hot pink #F11787 as the single accent colour, blush #FFE2F4 and yellow #FDE047 as secondary accents. Hard offset shadows (solid colour, no blur) on cards, the CTA button, and price cards. Rotated pink pill tags as section eyebrow labels. A small rotated yellow corner sticker reading "Just for you" near the top. Numbered circular badges only where the content is genuinely sequential (the call structure, a step-by-step). \`noindex, nofollow\` meta tag, since every one of these pages is private and unlisted.

Output

One HTML file, ready to drop into an Elementor HTML widget or host directly at a private, unlisted slug. Nothing else in the response, no explanation of what you did, just the file.`;

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

// Strips a leading/trailing ```html fence defensively — the prompt says
// "nothing else in the response", but models sometimes wrap output in a
// code fence anyway.
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:\w+)?\n([\s\S]*)\n```$/);
  return fenced ? fenced[1].trim() : trimmed;
}

export async function generateCallProposalHtml(
  input: CallProposalGenerationInput
): Promise<string> {
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

  return stripCodeFence(textBlock.text);
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
// not inventing a new shape. Deliberately doesn't re-derive summary or
// next-steps — those already exist from Phase 12's ingestion.
const RECAP_DETAILS_SYSTEM_PROMPT = `You are extracting structured detail from the raw text of a client call transcript or meeting notes document, for a call-recap page the client will read afterwards.

Decisions: only things that were actually agreed or decided on the call, stated plainly in one sentence each. Do not include a decision that wasn't actually reached — if nothing was decided, return an empty list.

Details: a short, topic-by-topic breakdown of what was substantively discussed, grouped into 2-5 topics. Each needs a short one or two word label (e.g. "PRICING", "SEGMENTS"), a specific title naming the actual topic, and a body paragraph in plain language covering what was actually said, not generic advice. Ground every specific in what's actually in the document — no invented numbers or details.

Respond with only a JSON object, no other text, in exactly this shape:
{"decisions": ["first decision", "second decision"], "details": [{"label": "TOPIC", "title": "Specific title", "body": "Paragraph covering what was discussed."}]}`;

export interface CallRecapDetails {
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
    decisions?: unknown;
    details?: unknown;
  };
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

  return { decisions, details };
}
