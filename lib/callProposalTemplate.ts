import { ABOUT, CADENCE, FAQ_ITEMS, FOOTER, TESTIMONIALS } from "./callProposalFixedContent";

// Fills the reskinned "Bento" call-proposal template (Her AI Club design
// library, reskinned to Falling Forwards' calm-register brand — see
// V-BUILD-SPEC handoff, Aug 2026) with per-prospect content. The CSS/
// layout below is lifted verbatim from that reskin; only the primitives
// block would ever change on a future rebrand. generateCallProposalHtml
// in lib/anthropic.ts gets structured content from the AI and passes it
// here rather than asking the AI to write raw HTML/CSS itself — this is
// what makes every generated proposal come out at the same visual
// standard instead of an AI-improvised approximation of it.

export interface ScopePhase {
  name: string;
  deliverables: { label: string; desc: string; tag: "Deliverable" | "Session" }[];
}

export interface InvestmentSingle {
  label: string;
  amount: string;
  terms: string;
  includes: string[];
  note: string;
}

export interface InvestmentTier {
  name: string;
  price: string;
  features: string[];
  bestFor: string;
  featured: boolean;
}

export interface CallProposalContent {
  titleLine1: string;
  titleEmphasis: string;
  subtitle: string;

  recapLede: string;
  recapPara1: string;
  recapPara2: string;
  recapGoals: string[];
  recapQuote: string;
  recapQuoteCaption: string;

  offerName: string;
  planBody: string;

  scopePhases: ScopePhase[];
  notIncluded: string[];

  investmentVariant: "single" | "tiers";
  investmentSingle?: InvestmentSingle;
  investmentTiers?: InvestmentTier[];
  investmentNote: string;

  replyAside: string;

  // Which TESTIMONIALS pool indices to show (0-2 entries) — chosen by the
  // AI from the real pool, never written by it.
  testimonialIndices: number[];

  startDate: string | null; // ISO date, only when genuinely stated on the call
}

export interface CallProposalMeta {
  prospectName: string;
  callDate: string | null; // ISO date
  validThrough: string; // ISO date
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateLong(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The six-call method is fixed practice, same for every client — only
// the date windows move, computed from the kickoff date. Not AI content.
function buildTimelineCards(startDate: string): { window: string; title: string; body: string }[] {
  const findDate = addDays(startDate, 14);
  const fortifyDate = addDays(startDate, 56);
  const futureDate = addDays(startDate, 70);
  return [
    {
      window: `${formatDateShort(startDate)}–${formatDateShort(findDate)}`,
      title: "Kickoff, Find &amp; Focus",
      body: "We start with the GOLD Report and Evidence Dashboard already built from your data, then work out where the real opportunity is and what actually deserves attention first.",
    },
    {
      window: `${formatDateShort(addDays(startDate, 28))}–${formatDateShort(fortifyDate)}`,
      title: "Fix &amp; Fortify",
      body: "We move on the highest-impact changes and embed them so they hold without you having to police them.",
    },
    {
      window: formatDateShort(futureDate),
      title: "Future &amp; Handoff",
      body: "We map the next six to twelve months and you leave with a plan you can run without me.",
    },
  ];
}

function renderGoals(goals: string[]): string {
  return goals
    .map(
      (g, i) =>
        `<li><span class="goal-num">${String(i + 1).padStart(2, "0")}</span>${esc(g)}</li>`
    )
    .join("\n        ");
}

function renderPhaseGroups(phases: ScopePhase[]): string {
  return phases
    .map((phase, i) => {
      const deliverables = phase.deliverables
        .map(
          (d) =>
            `<li><span><strong>${esc(d.label)}:</strong> <span class="deliverable-desc">${esc(d.desc)}</span></span><span class="deliverable-tag">${esc(d.tag)}</span></li>`
        )
        .join("\n        ");
      return `<div class="phase-group">
      <div class="phase-group-head">
        <span class="phase-group-num">${String(i + 1).padStart(2, "0")}</span>
        <h3 class="phase-group-title">${esc(phase.name)}</h3>
      </div>
      <ul class="deliverable-list">
        ${deliverables}
      </ul>
    </div>`;
    })
    .join("\n    ");
}

function renderNotIncluded(items: string[]): string {
  if (items.length === 0) return "";
  return `<div class="not-included">
      <h4>Not included in this scope</h4>
      <ul>
        ${items.map((i) => `<li>${esc(i)}</li>`).join("\n        ")}
      </ul>
      <p class="nudge">Need one of these? We can scope it as an add-on. Just ask.</p>
    </div>`;
}

function renderTimelineSection(startDate: string | null): string {
  if (!startDate) return "";
  const cards = buildTimelineCards(startDate);
  const cardsHtml = cards
    .map(
      (c, i) => `<div class="timeline-card">
        <div class="timeline-card-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="timeline-card-window">${c.window}</div>
        <h4>${c.title}</h4>
        <p>${c.body}</p>
      </div>`
    )
    .join("\n      ");
  return `<section class="pv-section on-pink" id="timeline">
  <div class="pv-inner">
    <div class="eyebrow-pill">Timeline</div>
    <h2 class="display-header">How it <span class="em">unfolds.</span></h2>
    <div class="timeline-grid">
      ${cardsHtml}
    </div>
  </div>
</section>`;
}

function renderInvestmentSection(content: CallProposalContent): string {
  if (content.investmentVariant === "single" && content.investmentSingle) {
    const inv = content.investmentSingle;
    return `<section class="pv-section on-accent" id="investment">
  <div class="pv-inner">
    <div class="eyebrow-pill">The Investment</div>
    <h2 class="display-header">One package.<br><span class="em">Everything included.</span></h2>
    <div class="price-card">
      <div>
        <div class="price-card-label">${esc(inv.label)}</div>
        <div class="price-card-amount">${esc(inv.amount)}</div>
        <p class="price-card-terms">${esc(inv.terms)}</p>
      </div>
      <div class="price-includes">
        <h4>This includes</h4>
        <ul>
          ${inv.includes.map((i) => `<li>${esc(i)}</li>`).join("\n          ")}
        </ul>
      </div>
    </div>
    <p class="investment-note">${esc(inv.note)}</p>
  </div>
</section>`;
  }

  const tiers = content.investmentTiers ?? [];
  const tiersHtml = tiers
    .map(
      (t, i) => `<div class="tier-card${t.featured ? " tier-featured" : ""}">
        ${t.featured ? '<span class="tier-flag">Recommended</span>' : ""}
        <div class="tier-card-head"><span>Option ${String(i + 1).padStart(2, "0")}</span></div>
        <div class="tier-name">${esc(t.name)}</div>
        <div class="tier-price">${esc(t.price)}</div>
        <ul class="tier-list">
          ${t.features.map((f) => `<li>${esc(f)}</li>`).join("\n          ")}
        </ul>
        <div class="tier-foot">Best for: ${esc(t.bestFor)}</div>
      </div>`
    )
    .join("\n      ");
  return `<section class="pv-section on-peach" id="investment">
  <div class="pv-inner">
    <div class="eyebrow-pill">The Investment</div>
    <h2 class="display-header">Ways <span class="em">in.</span></h2>
    <div class="tier-grid">
      ${tiersHtml}
    </div>
    <p class="investment-note">${esc(content.investmentNote)}</p>
  </div>
</section>`;
}

function renderProofSection(indices: number[]): string {
  const picks = indices
    .map((i) => TESTIMONIALS[i])
    .filter((t): t is (typeof TESTIMONIALS)[number] => Boolean(t))
    .slice(0, 2);
  if (picks.length === 0) return "";
  const cards = picks
    .map(
      (t) => `<figure class="proof-card">
        <blockquote>${esc(t.quote)}</blockquote>
        <figcaption>${esc(t.clientName)} · ${esc(t.clientBusiness)}</figcaption>
      </figure>`
    )
    .join("\n      ");
  return `<section class="pv-section on-pink" id="proof">
  <div class="pv-inner">
    <div class="eyebrow-pill">Kind Words</div>
    <h2 class="display-header">Client <span class="em">love.</span></h2>
    <div class="proof-grid">
      ${cards}
    </div>
  </div>
</section>`;
}

function renderFaqSection(): string {
  const items = FAQ_ITEMS.map(
    (f) => `<details class="faq-item">
      <summary>${esc(f.question)}</summary>
      <div class="faq-body">${esc(f.answer)}</div>
    </details>`
  ).join("\n    ");
  return `<section class="pv-section on-cream" id="faq">
  <div class="pv-inner">
    <div class="eyebrow-pill">Good Questions</div>
    <h2 class="display-header">Before you <span class="em">ask.</span></h2>
    ${items}
  </div>
</section>`;
}

function renderAboutSection(): string {
  const hasPhoto = Boolean(ABOUT.photoUrl);
  return `<section class="pv-section on-white" id="about">
  <div class="pv-inner">
    <div class="about-grid">
      <div class="about-photo${hasPhoto ? " has-photo" : ""}"${
        hasPhoto ? ` style="background-image: url('${esc(ABOUT.photoUrl as string)}')"` : ""
      }>
        <span class="about-photo-label">Your Photo Here</span>
      </div>
      <div class="about-copy">
        <div class="eyebrow-pill">Why Me</div>
        <h2 class="display-header" style="font-size: clamp(42px, 5vw, 60px);">The person<br><span class="em">behind the plan.</span></h2>
        <p>${esc(ABOUT.bio)}</p>
        <div class="about-facts">
          <div>Based In <strong>${esc(ABOUT.basedIn)}</strong></div>
          <div>Specialty <strong>${esc(ABOUT.specialty)}</strong></div>
          <div>Since <strong>${esc(ABOUT.since)}</strong></div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function renderHowWeWorkSection(): string {
  return `<section class="pv-section on-cream" id="how">
  <div class="pv-inner">
    <div class="eyebrow-pill">How We'll Work</div>
    <h2 class="display-header">Simple, <span class="em">on purpose.</span></h2>
    <div class="cadence-grid">
      <div class="cadence-card">
        <h4>Weekly <span>rhythm</span></h4>
        <p>${esc(CADENCE.rhythm)}</p>
      </div>
      <div class="cadence-card">
        <h4>One <span>channel</span></h4>
        <p>${esc(CADENCE.channel)}</p>
      </div>
      <div class="cadence-card">
        <h4>Your <span>homework</span></h4>
        <p>${esc(CADENCE.homework)}</p>
      </div>
    </div>
  </div>
</section>`;
}

export function assembleCallProposalHtml(
  content: CallProposalContent,
  meta: CallProposalMeta
): string {
  const jumpNavItems = [
    '<a class="jump-nav-item" href="#recap">Where You Are</a>',
    '<a class="jump-nav-item" href="#plan">The Plan</a>',
    '<a class="jump-nav-item" href="#scope">Scope</a>',
    content.startDate ? '<a class="jump-nav-item" href="#timeline">Timeline</a>' : "",
    '<a class="jump-nav-item" href="#investment">Investment</a>',
    '<a class="jump-nav-item" href="#next">Next Steps</a>',
  ]
    .filter(Boolean)
    .join("\n  ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Proposal for ${esc(meta.prospectName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;800&display=swap" rel="stylesheet">
<style>
:root {
  --color-ink: #0a0608;
  --color-ink-raised: #1e1a1c;
  --color-ink-deep: #060404;
  --color-gray-mid: #6e6669;
  --color-gray-soft: #a39da0;
  --color-surface: #FFE2F4;
  --color-surface-2: #fff4fa;
  --color-pure-white: #ffffff;
  --color-brand-primary: #F11787;
  --color-brand-primary-deep: #C1126C;
  --color-brand-primary-soft: #FFE2F4;
  --color-brand-secondary: #FAF3E9;
  --color-brand-secondary-deep: #D9C9A3;
  --color-brand-secondary-soft: #FCF8F0;
  --color-brand-tertiary: #FDE047;
  --color-brand-tertiary-deep: #D7BE3C;
  --color-brand-tertiary-soft: #FEF2B5;

  --font-display: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-body: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-accent: 'Bricolage Grotesque', system-ui, sans-serif;

  --fw-regular: 500; --fw-medium: 500; --fw-semibold: 500; --fw-bold: 800; --fw-extrabold: 800;

  --tracking-display: 0.5px; --tracking-sub: 0.3px; --tracking-wide: 2px; --tracking-wider: 2.5px;

  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 20px; --radius-pill: 999px; --radius-circle: 50%;
  --border-width-hairline: 1px; --border-width-medium: 2px; --border-width-thick: 2px;

  --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --space-16: 64px; --space-18: 72px; --space-24: 96px; --space-32: 128px;

  --surface-primary: var(--color-surface);
  --surface-card: var(--color-surface-2);
  --surface-pure: var(--color-pure-white);
  --surface-inverse: var(--color-ink-raised);
  --surface-accent: var(--color-brand-primary);
  --surface-accent-soft: var(--color-brand-primary-soft);
  --surface-support: var(--color-brand-secondary);
  --surface-pop: var(--color-brand-tertiary);

  --text-primary: var(--color-ink);
  --text-secondary: color-mix(in srgb, var(--color-ink) 88%, var(--color-surface-2));
  --text-muted: var(--color-gray-mid);
  --text-subtle: var(--color-gray-soft);
  --text-inverse: var(--color-surface-2);
  --text-on-dark-85: color-mix(in srgb, var(--color-surface-2) 85%, transparent);
  --text-on-dark-70: color-mix(in srgb, var(--color-surface-2) 70%, transparent);
  --text-on-dark-45: color-mix(in srgb, var(--color-surface-2) 45%, transparent);

  --accent: var(--color-brand-primary);
  --accent-deep: var(--color-brand-primary-deep);
  --accent-soft: var(--color-brand-primary-soft);
  --accent-2: var(--color-brand-secondary);
  --accent-2-deep: var(--color-brand-secondary-deep);
  --accent-2-soft: var(--color-brand-secondary-soft);
  --accent-3: var(--color-brand-tertiary);
  --accent-3-deep: var(--color-brand-tertiary-deep);
  --accent-3-soft: var(--color-brand-tertiary-soft);
  --accent-on-dark: color-mix(in srgb, var(--color-brand-primary) 58%, var(--color-pure-white));

  --divider-on-light: color-mix(in srgb, var(--color-ink) 13%, transparent);
  --divider-on-dark: color-mix(in srgb, var(--color-surface-2) 18%, transparent);
  --divider-on-accent: color-mix(in srgb, var(--color-ink) 25%, transparent);
  --border-card: color-mix(in srgb, var(--color-ink) 90%, transparent);
  --border-square: color-mix(in srgb, var(--color-ink) 40%, transparent);

  --dark-fill: var(--color-ink-raised);
  --shadow-card: 0 2px 12px color-mix(in srgb, var(--color-ink) 6%, transparent);
  --shadow-lift: 0 12px 30px color-mix(in srgb, var(--color-ink) 12%, transparent);
  --compartment-border: var(--border-width-medium) solid var(--border-card);

  --cover-radius: clamp(20px, 3vw, 32px);
  --cover-pad: clamp(12px, 2vw, 24px);

  --section-pad-y: clamp(var(--space-18), 9vw, var(--space-32));
  --section-pad-y-lg: clamp(var(--space-24), 11vw, 160px);
  --section-gutter: clamp(var(--space-6), 6vw, 150px);
  --content-max: clamp(680px, 72vw, 960px);

  --t-display: clamp(52px, 7vw, 88px);
  --t-statement: clamp(46px, 6.2vw, 76px);
  --t-h3: clamp(24px, 2.6vw, 34px);
  --t-body: 18px;
  --t-body-lg: clamp(19px, 1.6vw, 22px);
  --t-meta: 13px;
  --t-eyebrow: 13px;
  --t-price: clamp(56px, 6vw, 84px);

  --num-chip-size: 44px;
  --num-chip-size-sm: 34px;

  --highlight-pad-x: 0.18em; --highlight-pad-top: 0.02em; --highlight-pad-bottom: 0.06em;
  --highlight-leading: 1.02; --highlight-radius: 6px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  background: var(--surface-primary);
  color: var(--text-primary);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.skip-link {
  position: absolute; left: -9999px; top: 0;
  background: var(--surface-inverse); color: var(--text-inverse);
  padding: 12px 20px; z-index: 2000; font-size: 14px; text-decoration: none;
}
.skip-link:focus { left: 0; }

.pv-section { padding: var(--section-pad-y) var(--section-gutter); }
.pv-inner { max-width: var(--content-max); margin: 0 auto; }

.on-pink { background: var(--surface-primary); color: var(--text-primary); }
.on-cream { background: var(--surface-card); color: var(--text-primary); }
.on-white { background: var(--surface-pure); color: var(--text-primary); }
.on-peach { background: var(--surface-support); color: var(--text-primary); }
.on-accent { background: var(--surface-accent); color: var(--text-primary); }
.on-dark { background: var(--dark-fill); color: var(--text-inverse); }

.em {
  font-family: var(--font-accent);
  font-style: normal; font-weight: var(--fw-regular);
  text-transform: none;
  font-size: 1.15em;
  line-height: 0.75;
  letter-spacing: 0;
}
.highlight {
  background: var(--accent-3); color: var(--text-primary);
  display: inline-block;
  line-height: var(--highlight-leading);
  padding: var(--highlight-pad-top) var(--highlight-pad-x) var(--highlight-pad-bottom);
  border-radius: var(--highlight-radius);
  -webkit-box-decoration-break: clone; box-decoration-break: clone;
}
.on-accent .highlight { background: var(--surface-inverse); color: var(--accent-3); }
.on-dark .highlight { background: var(--accent-3); color: var(--color-ink); }

.eyebrow-pill {
  display: inline-flex; align-items: center; gap: 10px;
  font-size: var(--t-eyebrow); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase;
  color: var(--text-primary);
  background: var(--surface-pure);
  border: var(--border-width-hairline) solid var(--border-square);
  border-radius: var(--radius-pill);
  padding: 10px 22px;
  margin-bottom: var(--space-8);
}
.eyebrow-pill::before { content: "\\2726"; font-size: 14px; color: var(--accent-deep); }
.on-dark .eyebrow-pill { background: transparent; border-color: var(--divider-on-dark); color: var(--text-on-dark-70); }
.on-dark .eyebrow-pill::before { color: var(--accent-on-dark); }

.display-header {
  font-family: var(--font-display);
  font-weight: var(--fw-semibold);
  font-size: var(--t-display);
  line-height: 0.94;
  letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  margin-bottom: var(--space-6);
}
.section-lede {
  font-size: var(--t-body-lg); color: var(--text-secondary);
  max-width: 720px; margin-bottom: var(--space-10);
}
.on-accent .section-lede, .on-accent .statement-body, .on-accent .investment-note { color: var(--text-primary); }

.masthead {
  padding: clamp(64px, 9vw, 96px) var(--cover-pad) clamp(40px, 6vw, 72px);
  background: var(--surface-primary);
}
.letter {
  position: relative;
  max-width: 1040px; margin: 0 auto;
  background: var(--surface-pure);
  border: var(--compartment-border);
  border-radius: var(--cover-radius);
  padding: clamp(72px, 9vw, 104px) clamp(28px, 6vw, 80px) clamp(24px, 3vw, 32px);
  text-align: center;
}
.letter-seal {
  position: absolute; top: 0; left: 50%;
  transform: translate(-50%, -50%);
  width: clamp(104px, 13vw, 140px); aspect-ratio: 1;
  background: var(--accent-3);
  border: var(--compartment-border);
  border-radius: var(--radius-circle);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px;
  text-align: center;
  padding: 12px;
}
.letter-seal-star { color: var(--text-primary); font-size: clamp(16px, 2vw, 22px); line-height: 1; }
.letter-seal-label {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: clamp(12px, 1.3vw, 15px);
  letter-spacing: var(--tracking-sub); text-transform: uppercase;
  color: var(--text-primary); line-height: 1.25;
}
.letter-seal-label sup { font-size: 0.5em; vertical-align: top; margin-left: 2px; }
.letter .eyebrow-pill { margin-bottom: var(--space-8); }
.letter-title {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: clamp(46px, 6.5vw, 96px);
  line-height: 0.94; letter-spacing: var(--tracking-display);
  text-transform: uppercase;
  max-width: 820px; margin: 0 auto var(--space-6);
}
.letter-sub {
  font-size: var(--t-body-lg); color: var(--text-secondary);
  max-width: 580px; margin: 0 auto clamp(48px, 6vw, 72px);
}
.letter-meta {
  background: var(--dark-fill);
  border-radius: var(--radius-lg);
  padding: clamp(20px, 2.6vw, 28px) clamp(24px, 3vw, 40px);
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 20px;
  text-align: left;
}
.letter-meta-item {
  font-size: 11px; font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-on-dark-45);
}
.letter-meta-item strong {
  display: block; margin-top: 3px;
  font-size: 12px;
  color: var(--text-on-dark-85); font-weight: var(--fw-extrabold);
}

.jump-nav {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  gap: 4px; padding: 0 var(--section-gutter);
  background: var(--surface-pure);
  border-top: var(--border-width-hairline) solid var(--color-ink);
  border-bottom: var(--border-width-hairline) solid var(--color-ink);
  flex-wrap: wrap;
}
.jump-nav-item {
  font-size: 12px; font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-primary); text-decoration: none;
  padding: 17px 16px; white-space: nowrap;
  border-bottom: 2px solid transparent;
}
.jump-nav-item:hover { border-bottom-color: var(--accent-deep); }

.recap-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-16);
  align-items: start;
}
.recap-copy p { font-size: 16px; color: var(--text-secondary); }
.recap-copy p + p { margin-top: var(--space-4); }
.quote-card {
  position: relative;
  background: var(--surface-pure);
  border: var(--compartment-border);
  border-radius: var(--radius-lg);
  padding: calc(var(--space-8) + 60px) var(--space-10) var(--space-8);
  box-shadow: var(--shadow-card);
}
.quote-card::before {
  content: "";
  position: absolute; top: 28px; left: 28px;
  width: 56px; height: 44px;
  background: var(--accent-deep);
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 18'%3E%3Cpath d='M0 11.3C0 5.7 3.4 1.8 8.7 0l1.5 2.6C6.9 4 5.2 6.2 5 8.4c.4-.2 1-.3 1.6-.3 2.4 0 4.2 1.8 4.2 4.4 0 2.7-2 4.7-4.8 4.7C2.6 17.2 0 14.9 0 11.3zm13 0c0-5.6 3.4-9.5 8.7-11.3l1.5 2.6c-3.3 1.4-5 3.6-5.2 5.8.4-.2 1-.3 1.6-.3 2.4 0 4.2 1.8 4.2 4.4 0 2.7-2 4.7-4.8 4.7-3.4 0-6-2.3-6-5.9z'/%3E%3C/svg%3E") no-repeat center / contain;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 18'%3E%3Cpath d='M0 11.3C0 5.7 3.4 1.8 8.7 0l1.5 2.6C6.9 4 5.2 6.2 5 8.4c.4-.2 1-.3 1.6-.3 2.4 0 4.2 1.8 4.2 4.4 0 2.7-2 4.7-4.8 4.7C2.6 17.2 0 14.9 0 11.3zm13 0c0-5.6 3.4-9.5 8.7-11.3l1.5 2.6c-3.3 1.4-5 3.6-5.2 5.8.4-.2 1-.3 1.6-.3 2.4 0 4.2 1.8 4.2 4.4 0 2.7-2 4.7-4.8 4.7-3.4 0-6-2.3-6-5.9z'/%3E%3C/svg%3E") no-repeat center / contain;
}
.quote-card blockquote {
  font-family: var(--font-body); font-weight: var(--fw-medium);
  font-size: clamp(19px, 2vw, 24px); line-height: 1.35;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
}
.quote-card figcaption {
  font-size: var(--t-meta); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-muted);
  border-top: var(--border-width-hairline) solid var(--divider-on-light);
  padding-top: var(--space-4);
}
.goal-list { list-style: none; margin-top: var(--space-8); }
.goal-list li {
  position: relative;
  padding-left: calc(var(--num-chip-size-sm) + var(--space-5));
  padding-top: var(--space-3); padding-bottom: var(--space-3);
  border-top: var(--border-width-hairline) solid var(--divider-on-light);
  font-size: var(--t-body); color: var(--text-secondary);
}
.goal-list li:last-child { border-bottom: var(--border-width-hairline) solid var(--divider-on-light); }
.goal-num {
  position: absolute; left: 0; top: 50%; margin-top: calc(var(--num-chip-size-sm) / -2);
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 16px; color: var(--text-primary);
  width: var(--num-chip-size-sm); height: var(--num-chip-size-sm);
  background: var(--accent-3); border-radius: var(--radius-sm);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.statement-section { padding: var(--section-pad-y-lg) var(--section-gutter); text-align: left; }
.statement-title {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: var(--t-statement); line-height: 1.1;
  letter-spacing: var(--tracking-display); text-transform: uppercase;
  max-width: 1000px;
  margin-bottom: var(--space-8);
}
.statement-body {
  font-size: var(--t-body-lg); max-width: 760px; color: var(--text-primary);
}

.phase-group {
  background: var(--surface-card);
  border: var(--compartment-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-8) var(--space-5);
  margin-bottom: var(--space-6);
}
.phase-group:last-of-type { margin-bottom: var(--space-10); }
.phase-group-head {
  display: flex; align-items: center; gap: var(--space-5);
  padding-bottom: var(--space-4); margin-bottom: var(--space-2);
  border-bottom: var(--border-width-medium) solid var(--text-primary);
}
.phase-group-num {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 18px; color: var(--text-primary);
  width: var(--num-chip-size); height: var(--num-chip-size);
  background: var(--accent-3); border-radius: var(--radius-sm);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.phase-group-title {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: var(--t-h3); letter-spacing: var(--tracking-sub);
  text-transform: uppercase;
}
.deliverable-list { list-style: none; }
.deliverable-list li {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-6);
  align-items: baseline;
  padding-top: var(--space-4); padding-bottom: var(--space-4);
  border-bottom: var(--border-width-hairline) solid var(--divider-on-light);
  font-size: var(--t-body); color: var(--text-secondary);
}
.deliverable-list li strong { color: var(--text-primary); font-weight: var(--fw-semibold); }
.deliverable-desc { font-size: 15px; color: var(--text-muted); }
.deliverable-tag {
  font-size: 11px; font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-primary);
  background: var(--accent-2);
  border-radius: var(--radius-pill);
  padding: 5px 13px; white-space: nowrap;
}
.not-included {
  background: var(--accent-2-soft);
  border-radius: var(--radius-lg);
  padding: var(--space-8) var(--space-10);
  margin-top: var(--space-10);
}
.not-included h4 {
  font-size: var(--t-meta); font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase;
  color: var(--text-primary); margin-bottom: var(--space-4);
}
.not-included ul { list-style: none; }
.not-included li {
  font-size: 16px; color: var(--text-muted);
  padding: 6px 0 6px 24px; position: relative;
}
.not-included li::before {
  content: "+"; position: absolute; left: 0; top: 5px;
  font-weight: var(--fw-bold); color: var(--text-subtle);
}
.not-included p.nudge {
  margin-top: var(--space-4); font-size: 15px; color: var(--text-muted);
}

.timeline-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6);
}
.timeline-card {
  background: var(--surface-pure);
  border: var(--compartment-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-card);
  display: flex; flex-direction: column;
}
.timeline-card-num {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 18px; color: var(--text-primary);
  width: var(--num-chip-size); height: var(--num-chip-size);
  background: var(--accent-3); border-radius: var(--radius-sm);
  display: inline-flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-3);
}
.timeline-card-window {
  font-size: var(--t-meta); font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--accent-deep); margin-bottom: var(--space-4);
}
.timeline-card h4 {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 26px; letter-spacing: var(--tracking-sub); text-transform: uppercase;
  margin-bottom: var(--space-3); line-height: 1.1;
}
.timeline-card p { font-size: 16px; color: var(--text-muted); }

.price-card {
  background: var(--surface-pure);
  border: var(--compartment-border);
  border-radius: var(--radius-lg);
  padding: var(--space-12) var(--space-12) var(--space-10);
  box-shadow: var(--shadow-lift);
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-12);
  align-items: center;
}
.price-card-label {
  font-size: var(--t-meta); font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wider); text-transform: uppercase;
  color: var(--text-muted); margin-bottom: var(--space-4);
}
.price-card-amount {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: var(--t-price); line-height: 0.95; letter-spacing: 0;
  color: var(--text-primary);
}
.price-card-terms {
  margin-top: var(--space-5); font-size: 15px; color: var(--text-muted);
}
.price-includes h4 {
  font-size: var(--t-meta); font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--accent-deep);
  border-bottom: var(--border-width-hairline) solid var(--divider-on-light);
  padding-bottom: var(--space-3); margin-bottom: var(--space-4);
}
.price-includes ul { list-style: none; }
.price-includes li {
  font-size: 16px; color: var(--text-secondary);
  padding: 8px 0 8px 26px; position: relative;
}
.price-includes li::before {
  content: "+"; position: absolute; left: 0; top: 7px;
  font-weight: var(--fw-bold); font-size: 17px; color: var(--accent-deep);
}

.tier-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6);
  align-items: stretch;
}
.tier-card {
  background: var(--surface-pure);
  border: var(--compartment-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  display: flex; flex-direction: column;
  box-shadow: var(--shadow-card);
}
.tier-card.tier-featured { box-shadow: var(--shadow-lift); position: relative; }
.tier-card-head {
  display: flex; justify-content: space-between; align-items: center;
  font-size: var(--t-meta); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-muted);
  padding-bottom: var(--space-4); margin-bottom: var(--space-5);
  border-bottom: var(--border-width-hairline) solid var(--divider-on-light);
}
.tier-flag {
  position: absolute; top: 0; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px; font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  background: var(--surface-inverse); color: var(--text-inverse);
  border-radius: var(--radius-pill); padding: 7px 18px;
  white-space: nowrap;
}
.tier-name {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 30px; letter-spacing: var(--tracking-sub); text-transform: uppercase;
  margin-bottom: var(--space-2); line-height: 1.1;
}
.tier-price {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 44px; letter-spacing: 0; line-height: 1;
  color: var(--text-primary); margin-bottom: var(--space-5);
}
.tier-list { list-style: none; margin-bottom: var(--space-6); }
.tier-list li {
  font-size: 15px; color: var(--text-secondary);
  padding: 7px 0 7px 26px; position: relative;
  border-bottom: var(--border-width-hairline) solid color-mix(in srgb, var(--color-ink) 6%, transparent);
}
.tier-list li::before {
  content: "+"; position: absolute; left: 0; top: 6px;
  font-weight: var(--fw-bold); color: var(--accent-deep);
}
.tier-foot {
  margin-top: auto;
  font-size: var(--t-meta); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-muted);
}
.investment-note {
  margin-top: var(--space-8);
  font-size: 15px; color: var(--text-primary);
  border-top: var(--border-width-hairline) solid var(--divider-on-accent);
  padding-top: var(--space-5);
  max-width: 760px;
}
.on-accent .display-header, .on-accent .statement-title { color: var(--text-primary); }

.cadence-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-6); margin-top: var(--space-8); }
.cadence-card {
  background: var(--surface-pure);
  border: var(--compartment-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  box-shadow: var(--shadow-card);
}
.cadence-card h4 {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 24px; letter-spacing: var(--tracking-sub); text-transform: uppercase;
  margin-bottom: var(--space-3);
}
.cadence-card h4 span {
  font-family: var(--font-accent); font-weight: var(--fw-regular);
  font-size: 1.15em; line-height: 0.75; letter-spacing: 0;
  text-transform: none;
}
.cadence-card p { font-size: 16px; color: var(--text-muted); }

.about-grid {
  display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: var(--space-16);
  align-items: center;
}
.about-photo {
  width: 300px; aspect-ratio: 1;
  border-radius: var(--radius-circle);
  background: var(--surface-support);
  background-size: cover; background-position: center;
  border: var(--compartment-border);
  display: flex; align-items: center; justify-content: center;
}
.about-photo-label {
  font-size: var(--t-meta); font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-primary);
  background: var(--surface-pure);
  border-radius: var(--radius-pill); padding: 10px 18px;
  text-align: center;
}
.about-photo.has-photo .about-photo-label { display: none; }
.about-copy p { font-size: var(--t-body); color: var(--text-secondary); }
.about-facts {
  display: flex; flex-wrap: wrap; gap: var(--space-5) var(--space-10); margin-top: var(--space-8);
  border-top: var(--border-width-hairline) solid var(--divider-on-light);
  padding-top: var(--space-5);
  font-size: var(--t-meta); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-muted);
}
.about-facts strong { display: block; margin-top: 4px; color: var(--text-primary); font-weight: var(--fw-extrabold); }

.proof-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--space-6); }
.proof-card {
  background: var(--surface-pure);
  border-left: var(--border-width-thick) solid var(--accent);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  padding: var(--space-8) var(--space-10);
  box-shadow: var(--shadow-card);
}
.proof-card blockquote {
  font-family: var(--font-body); font-weight: var(--fw-medium);
  font-size: clamp(17px, 1.8vw, 21px); line-height: 1.4;
  color: var(--text-primary); margin-bottom: var(--space-5);
}
.proof-card figcaption {
  font-size: var(--t-meta); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  color: var(--text-muted);
}

.faq-item { border-bottom: var(--border-width-hairline) solid var(--divider-on-light); }
.faq-item:first-of-type { border-top: var(--border-width-hairline) solid var(--divider-on-light); }
.faq-item summary {
  cursor: pointer; list-style: none;
  display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-6);
  padding: var(--space-5) 0;
  font-family: var(--font-display); font-weight: var(--fw-medium);
  font-size: 20px; letter-spacing: var(--tracking-sub); text-transform: uppercase;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after {
  content: "+"; font-family: var(--font-body);
  color: var(--accent-deep); font-size: 22px; font-weight: var(--fw-bold);
  flex-shrink: 0;
}
.faq-item[open] summary::after { content: "\\2212"; }
.faq-item .faq-body {
  padding: 0 0 var(--space-6);
  font-size: 16px; color: var(--text-secondary); max-width: 760px;
  text-transform: none;
}

.steps-list { list-style: none; margin-bottom: var(--space-10); }
.steps-list li {
  display: flex; gap: var(--space-6); align-items: flex-start;
  padding: var(--space-6) 0;
  border-bottom: var(--border-width-hairline) solid var(--divider-on-light);
}
.steps-list .step-num {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 18px; color: var(--text-primary);
  width: var(--num-chip-size); height: var(--num-chip-size);
  background: var(--accent-3); border-radius: var(--radius-sm);
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.steps-list h4 {
  font-family: var(--font-display); font-weight: var(--fw-semibold);
  font-size: 24px; letter-spacing: var(--tracking-sub); text-transform: uppercase;
  margin-bottom: 6px;
}
.steps-list p { font-size: 16px; color: var(--text-muted); max-width: 640px; }
.accept-row { display: flex; align-items: center; gap: var(--space-8); flex-wrap: wrap; }
.accept-btn {
  display: inline-flex; align-items: center; gap: 14px;
  background: var(--color-ink); color: var(--color-surface-2);
  font-size: 15px; font-weight: var(--fw-extrabold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
  text-decoration: none;
  padding: 20px 42px; border-radius: var(--radius-pill);
  border: var(--compartment-border);
  transition: opacity 0.15s;
}
.accept-btn::after { content: "\\2726"; font-size: 14px; }
.accept-btn:hover { opacity: 0.85; }
.accept-aside { font-size: 15px; color: var(--text-muted); }

.doc-footer {
  background: var(--dark-fill); color: var(--text-on-dark-45);
  padding: var(--space-10) var(--section-gutter);
  text-align: center;
  font-size: var(--t-meta); font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide); text-transform: uppercase;
}

@media (max-width: 1024px) {
  .recap-grid, .about-grid, .price-card { grid-template-columns: 1fr; gap: var(--space-10); }
  .about-photo { width: 240px; margin-inline: auto; }
}
@media (max-width: 768px) {
  .masthead { padding-top: 72px; }
  .letter { padding: 64px 24px 20px; }
  .letter-meta { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .timeline-grid, .tier-grid, .cadence-grid, .proof-grid { grid-template-columns: 1fr; }
  .jump-nav { justify-content: center; padding: 10px var(--section-gutter); }
  .jump-nav-item { padding: 4px 12px; }
  .phase-group-head { flex-wrap: wrap; }
  .deliverable-list li { grid-template-columns: 1fr; gap: var(--space-2); }
}
@media (max-width: 480px) {
  .accept-btn { width: 100%; justify-content: center; font-size: 13px; padding: 18px 24px; }
  .price-card { padding: var(--space-8); }
  .quote-card { padding: calc(var(--space-6) + 48px) var(--space-6) var(--space-6); }
  .quote-card::before { top: 22px; left: 22px; width: 44px; height: 34px; }
  .timeline-card, .tier-card, .cadence-card { padding: var(--space-6); }
  .phase-group { padding: var(--space-6) var(--space-5) var(--space-4); }
  .about-photo { width: 200px; }
  .letter { padding: 56px 18px 16px; }
  .letter-title { font-size: clamp(38px, 11vw, 46px); }
}
@media print {
  .jump-nav, .skip-link { display: none; }
  .pv-section, .statement-section { padding: 36px 28px; }
  .masthead { padding: 20px; }
  .quote-card, .timeline-card, .tier-card, .price-card, .proof-card, .cadence-card { box-shadow: none; break-inside: avoid; }
  .phase-group, .steps-list li, .faq-item { break-inside: avoid; }
  a { text-decoration: none; color: inherit; }
  .accept-btn { border: 2px solid var(--color-ink); background: none; color: var(--color-ink); }
}
</style>
</head>
<body>

<a class="skip-link" href="#recap">Skip to content</a>

<header class="masthead">
  <div class="letter">
    <div class="letter-seal">
      <span class="letter-seal-star">&#10022;</span>
      <span class="letter-seal-label">Falling<br>Forwards<sup>&trade;</sup></span>
    </div>
    <div class="eyebrow-pill">Private Proposal</div>
    <h1 class="letter-title">${esc(content.titleLine1)}<br><span class="em">${esc(content.titleEmphasis)}</span></h1>
    <p class="letter-sub">${esc(content.subtitle)}</p>
    <div class="letter-meta">
      <div class="letter-meta-item">Prepared For<strong>${esc(meta.prospectName)}</strong></div>
      <div class="letter-meta-item">Prepared By<strong>Zoë Dew</strong></div>
      <div class="letter-meta-item">Date<strong>${meta.callDate ? formatDateLong(meta.callDate) : "—"}</strong></div>
      <div class="letter-meta-item">Valid Through<strong>${formatDateLong(meta.validThrough)}</strong></div>
    </div>
  </div>
</header>

<nav class="jump-nav" aria-label="Jump to section">
  ${jumpNavItems}
</nav>

<section class="pv-section on-white" id="recap">
  <div class="pv-inner">
    <div class="eyebrow-pill">Where You Are</div>
    <h2 class="display-header">We heard <span class="em">you.</span></h2>
    <p class="section-lede">${esc(content.recapLede)}</p>
    <div class="recap-grid">
      <div class="recap-copy">
        <p>${esc(content.recapPara1)}</p>
        <p>${esc(content.recapPara2)}</p>
        <ul class="goal-list">
        ${renderGoals(content.recapGoals)}
        </ul>
      </div>
      <figure class="quote-card">
        <blockquote>${esc(content.recapQuote)}</blockquote>
        <figcaption>${esc(content.recapQuoteCaption)}</figcaption>
      </figure>
    </div>
  </div>
</section>

<section class="statement-section on-peach" id="plan">
  <div class="pv-inner">
    <div class="eyebrow-pill">The Recommendation</div>
    <h2 class="statement-title">Introducing<br><span class="highlight">${esc(content.offerName)}.</span></h2>
    <p class="statement-body">${esc(content.planBody)}</p>
  </div>
</section>

<section class="pv-section on-white" id="scope">
  <div class="pv-inner">
    <div class="eyebrow-pill">Scope of Work</div>
    <h2 class="display-header">What's <span class="em">included.</span></h2>
    <p class="section-lede">Everything this engagement covers, grouped the way the work will actually happen.</p>
    ${renderPhaseGroups(content.scopePhases)}
    ${renderNotIncluded(content.notIncluded)}
  </div>
</section>

${renderTimelineSection(content.startDate)}

${renderInvestmentSection(content)}

${renderHowWeWorkSection()}

${renderAboutSection()}

${renderProofSection(content.testimonialIndices)}

${renderFaqSection()}

<section class="pv-section on-white" id="next">
  <div class="pv-inner">
    <div class="eyebrow-pill">Next Steps</div>
    <h2 class="display-header">Saying yes is <span class="em">easy.</span></h2>
    <ol class="steps-list">
      <li>
        <span class="step-num">1</span>
        <div><h4>Review this proposal</h4><p>Take your time — it's valid through the date on the cover.</p></div>
      </li>
      <li>
        <span class="step-num">2</span>
        <div><h4>Ask anything</h4><p>Reply to my email or book a quick call if any part needs a conversation.</p></div>
      </li>
      <li>
        <span class="step-num">3</span>
        <div><h4>Reply and pick a start date</h4><p>${esc(content.replyAside)}</p></div>
      </li>
    </ol>
  </div>
</section>

<footer class="doc-footer">
  <span>${esc(FOOTER.businessName)} · ${esc(FOOTER.website)} · Prepared with care for ${esc(meta.prospectName)}</span>
</footer>

</body>
</html>`;
}
