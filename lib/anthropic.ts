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
// Covers thinking AND the response together, and Claude Opus 5 has thinking on
// by default where Opus 4.8 did not — a whole HTML page needs real headroom.
const MAX_TOKENS = 32000;

// Verbatim system prompt supplied by Zoë for the call-transcript proposal
// generator (V2-BUILD-SPEC.md Phase 11) — not paraphrased or shortened.
const SYSTEM_PROMPT = `You are writing a private, one-off proposal page for one specific prospect, built entirely from a call transcript. This is not a generic sales page. It is a decision document for one named person, built from what they actually said.

Before you write anything

Read the full transcript first.

Pull out, in your own working notes, only what was actually said:

- The prospect's situation: their business, numbers, revenue, list size, pricing, offers, customers, what they've tried, what seems to be working, what isn't, and anything else they stated.
- What they said they want, including anything vague, contradictory or half-formed.
- Any worries, objections or hesitations they raised.
- Any specific numbers, offer names, phrases or slightly weird details that make this business recognisably theirs.
- What Zoë questioned, challenged, noticed or became curious about.
- Anything that still appears unresolved at the end of the call.
- Whether pricing or package options were discussed live on the call. This determines everything about the Investment section.
- Any specific commitment Zoë made on the call: a discount, number of spaces, start date, payment structure or other term. These override any default.
- A start date, if one was agreed or even loosely mentioned, such as "early September". If only a rough window was given, pick one reasonable Monday inside that window.

If the transcript does not make clear whether pricing was discussed live, or what currency the prospect operates in, stop and ask before generating anything. Do not guess.

The rule that overrides everything else

Every specific has to trace back to something the prospect or Zoë actually said on the call.

No invented numbers.

No invented scenes.

No invented problems.

No generic credibility stack.

No manufactured urgency beyond a deadline or capacity limit that is actually true right now.

No pretending Zoë knows something she has not yet investigated.

If you do not have a real detail for a section, write the section more plainly rather than filling the gap with something invented.

This also governs the testimonial pool below. You may only select from it. Never write your own testimonial line, even in the same style.

How this should sound

This should sound like Zoë explaining her recommendation directly to the prospect after the call.

Not a consultant writing a formal document about them.

Not an agency presenting a strategy deck.

Not a coach delivering wisdom.

Not a copywriter trying to make every line sound impressive.

Not an AI trying to sound "warm and conversational".

The test is:

Could Zoë comfortably say this sentence aloud to this person on a call?

If it would feel embarrassing, overly polished, corporate or unlike something a normal person would say, rewrite it.

The thinking can be commercially sophisticated.

The language should stay normal.

Prefer words like:

- look
- check
- find
- work out
- decide
- fix
- test
- see
- understand

over language whose main job is making the work sound strategic.

Keep the writing one-to-one. It is for this person, not "business owners".

Use the prospect's actual world. Their offer names, numbers, customers, problems, phrases and odd details are more useful than generic business language.

Do not make the voice more formal when you reach Scope, Investment or Next Steps. The commercial parts should sound like the same person as the recap.

Show the reasoning

Do not jump straight from:

"They have this problem"

to:

"Here are the deliverables."

Wherever possible, let the prospect see why Zoë is recommending something.

Useful logic often looks like:

- You said X.
- Zoë noticed Y.
- That raises a question about Z.
- So this is where she wants to look first.

Do not mechanically use that structure in the copy. It describes the thinking, not a template.

Show the investigation.

Questions are useful when they reflect how Zoë actually thinks:

- What's driving that?
- How do we know?
- What are people actually buying?
- Why are they buying this but not that?
- Is this really a lead problem?
- What happened to the people who enquired?
- What's taking loads of time and making surprisingly little?
- What are we basing that on?

Do not describe Zoë as strategic, evidence-led, commercially minded, bespoke or insightful.

Demonstrate it through what she notices, questions and recommends.

Do not pretend the diagnosis is complete

The proposal should be decisive where the call gives Zoë a reason to be decisive.

Where something remains unresolved, say what Zoë wants to investigate rather than pretending she already knows the answer.

Natural uncertainty is allowed.

For example:

"I suspect there's something going on there, but I want to see the numbers before we decide."

"I don't want to assume that's the problem yet."

"That would be one of the first things I'd want to look at."

This is not weak writing.

Do not use vague corporate hedging such as:

"There may potentially be an opportunity to explore..."

Zoë is not selling omniscience. Part of the value is looking properly before deciding what the business needs.

What this engagement is called

Always call it a 90-day one-to-one strategic partnership.

Never "the six-call programme", "the six-call system", or similar.

The six calls are the mechanism inside the 90 days, not the name of the thing itself.

The word "programme" should not appear as the name of the engagement.

Spread the detail out. Do not repeat it.

A real transcript gives you far more raw material than any single section needs.

The prospect may have talked about:

- their numbers
- what they've tried
- specific frustrations
- worries
- old decisions
- offer structure
- customer behaviour
- things that surprised Zoë
- things Zoë challenged
- tangents that accidentally revealed something useful

Use different parts of that material for different sections.

If the Recap, Scope, Investment and Next Steps all lean on the same two or three facts restated in slightly different language, go back to the transcript.

That is a sign you have under-used it.

Look for repetition of function, not only repeated wording.

If two sections are both explaining the same problem, one of them probably needs to do something else.

Each item in "The next ninety days" and each of the five stages in "How it works" should refer to something distinct where the transcript gives you enough material.

Do not turn one problem into six differently named deliverables.

Page structure, in order

Hero. Addressed to the prospect by name. A one-line summary of what was actually discussed. The call date. Do not include a line describing what the page itself is or why it exists — go straight into the substance.

What I heard. Three short blocks, each one thing recapped from the transcript in plain language, in Zoë's voice, not the prospect's own words quoted back. This is the situation appraisal. No advice yet, just an accurate recap that shows she was listening.

The next ninety days. What working together would build, framed as things within the prospect's control (a plan, a decision, a piece of positioning, a system) rather than a promised financial outcome that depends on factors outside anyone's control. Four items, plain language, not identical sentence structures repeated four times.

How we'll know it's working. Concrete, checkable markers, not vague reassurance. Tie these to the actual deliverables (GOLD Report, Evidence Dashboard, Commercial Scorecard, Decision Log) and to something specific and true about this prospect's situation right now, not a generic KPI list.

How it works. The standard structure is exactly six calls total, never seven: a 90 minute kickoff, then five 60 minute calls one every other week. Do not add any further call, session, or "final call" beyond these six — the fifth and last of the five 60 minute calls (Future, below) is itself the final call and is where the next six to twelve months gets mapped. The kickoff is not a joint discovery session: it is where Zoe walks the prospect through the reports she has already prepared for them. The five 60 minute calls follow Zoe's five-stage method, in this order, and should be named and framed accordingly:

- Find. Identify where untapped revenue and opportunities already exist.
- Focus. Prioritise by return and decide what deserves attention first.
- Fix. Remove bottlenecks and implement the highest-impact improvements.
- Fortify. Embed the changes so they are repeatable without constant intervention.
- Future. Plan the next phase, mapping the next six to twelve months — this is the final call, not a lead-in to a further one.

Describe each step in terms of what it means for this specific prospect's problem, not in the abstract. If there is a genuine, sourced proof point relevant to this prospect's industry or situation, include it here as a short paragraph. If there isn't one that actually fits, leave the section without one rather than forcing an unrelated story in.

What each of us brings. Two short columns: what Zoë brings, what the prospect brings. Specific to what was actually asked of them on the call (send their history, answer honestly, do the agreed work between calls), not generic responsibility boilerplate.

Investment. This section branches:

- If specific pricing or package options were discussed live on the call, use exactly those options, those numbers, and nothing else. Do not add a third option, a deposit, or a payment plan that wasn't part of that conversation. If more than one option was discussed, show it as a toggle between exactly those options, matching the wording used on the call as closely as possible.
- If pricing was not discussed live, use the current standard offer terms and current live discount window and capacity, pulled from the pricing source of truth, not hardcoded into this prompt, since those change over time. Falling Forwards standard pricing is always quoted exclusive of VAT — state it as the amount plus VAT (e.g. "£3,300 + VAT"), not as a conditional "if UK." State the rest plainly too: whether a time-limited discount currently applies and its real deadline, and current capacity if that's genuinely limited right now.
- Do not introduce a deposit-to-hold-your-place mechanic unless it was specifically discussed on the call for this prospect. Some proposals will need one, most won't. Ask if unclear rather than defaulting it in.
- Show instalment figures as actual division of the total (total divided by 3, correctly rounded), never a vague "instalments available" without the number.

Closing. A short, personal note that references something specific from the call, not a generic sign-off. A plain prompt to reply with the start date they want. Do not promise to send an onboarding form, and do not ask them to state a payment plan preference in their reply — the separate signable proposal (sent after this) is where they choose how to pay, not this page. If there is a CTA button, its text should say "Reply and pick a start date" and it may use a mailto: link, but never as the only way to act — the sentence right before or after it must independently tell them in plain words to reply to the email, since mailto: links do not work on every device. Sign off "Zx".

Copy rules, always

British spelling throughout.

No em dashes.

No semicolons.

No smart quotes or curly apostrophes.

No false-contrast constructions such as:

"It's not X, it's Y."

No fake urgency or scarcity that is not real and current.

No rule-of-three rhetorical rhythm for the sake of sounding polished.

Never use "actually", "literally", "genuinely" or "quietly" as filler.

They may appear only where the word materially changes the meaning.

Never use "just" to minimise effort or execution.

No unprompted disclaimers.

No coach-voice motivational language.

No listicle cadence.

No jargon where a normal phrase works.

Avoid consultancy language such as:

- strategic roadmap
- unlock
- leverage
- tailored solution
- holistic
- bespoke approach
- optimise, where a normal verb works
- empower
- transform
- strategic clarity
- sustainable growth
- maximise
- drive growth
- identify key opportunities
- high-impact
- highest-leverage
- move the needle
- this engagement is designed to
- our work together will

These are not mechanically banned if one is genuinely the clearest factual phrase.

But if a normal person would say it another way, use the normal way.

Do not manufacture A Line™.

Be suspicious of neat, profound-sounding summaries.

If you have written an elegant sentence that could appear unchanged in another consultant's proposal, ask:

What does this actually mean for this prospect?

Then say that instead.

Specificity over polish.

Questions over claims about expertise.

Concrete behaviour over abstract strategy language.

Show why.

Do not merely announce what.

Final voice check

Before returning the page, silently read every line as though Zoë is saying it aloud to this prospect on a call.

Check:

- Does this sound like one person talking to another?
- Does the prospect recognise their actual business?
- Have I shown why Zoë is recommending these things?
- Have I accidentally made Zoë sound more formal once the commercial sections start?
- Is anything abstract that could be concrete?
- Have I turned uncertainty into fake certainty?
- Have I repeated the same fact or problem across several sections?
- Have I invented a deliverable because the structure looked empty?
- Does anything sound like a consultant, agency, coach, generic sales page or AI?
- Could another business adviser use this copy unchanged?

If yes, rewrite that part.

Do not make changes merely because another wording is possible.

Once the copy is clear, specific, recognisable and sounds natural aloud, stop.

Design, always the same system

Single self-contained HTML file, inline CSS and JS, no external dependencies beyond the Bricolage Grotesque Google Font (weight 500 for body text, 800 for headings — no other typeface, no script or accent face). Colour tokens: blush #FFE2F4 as the page background, cream #fff4fa for card interiors, ink #0a0608 for text and borders, pink #F11787 as the one accent colour (the investment section and the accept CTA carry it — the boldest colour on the page), yellow #FDE047 for highlights and numbered badges. Calm and premium, not sticker-pop: cards have a 2px solid ink border, ~20px radius, flat with no shadow, no tilt or rotation on anything. Pills and tags (section eyebrows, badges) are fully rounded, ink-bordered, and outlined — transparent or cream fill, not solid-filled — except the accept CTA button itself, which stays ink-filled with cream text, uppercase, fully rounded. No corner stickers, no decorative rotation anywhere. Numbered circular badges only where the content is genuinely sequential (the call structure, a step-by-step). \`noindex, nofollow\` meta tag, since every one of these pages is private and unlisted — this is a meta tag only, not visible copy. Do not add a visible footer or disclaimer line stating that the page is private, unlisted, or prepared for the prospect. The page ends after the closing note and sign-off.

Output

One HTML file, ready to drop into an Elementor HTML widget or host directly at a private, unlisted slug. Nothing else in the response, no explanation of what you did, just the file.
`;

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

  const data = (await res.json()) as {
    content: { type: string; text?: string }[];
    stop_reason?: string;
  };

  // A truncated page still looks like plausible HTML, so nothing downstream
  // would catch it — this is the only place it surfaces.
  if (data.stop_reason === "max_tokens") {
    throw new Error(
      "The AI ran out of output budget before finishing the page. Try a shorter transcript, or raise MAX_TOKENS in lib/anthropic.ts."
    );
  }

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
