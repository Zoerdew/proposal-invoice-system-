// Content for the sections of a generated call proposal that don't vary
// by prospect — Zoë's own bio/cadence/FAQ/testimonials. Confirmed with
// her (2026-08-18): these are written once and reused verbatim on every
// generated proposal, rather than regenerated per prospect.
//
// EVERYTHING BELOW MARKED "PLACEHOLDER" IS DUMMY CONTENT, not real —
// per CLAUDE.md, invented copy never ships to a real prospect. Replace
// each one with Zoë's actual content before this goes live.

export const ABOUT = {
  // PLACEHOLDER — replace with a real, publicly hosted image URL
  // (.jpg/.png/.webp, loads in an incognito tab — not a Drive/Dropbox
  // share link). Leave null to show the "Your Photo Here" label instead
  // of a broken image.
  photoUrl: null as string | null,
  // PLACEHOLDER bio
  bio: "Two or three sentences of bio, aimed at the client: who Zoë helps, what she's known for, and the experience that makes her the right fit for this project. — PLACEHOLDER, replace with real copy.",
  basedIn: "PLACEHOLDER CITY",
  specialty: "PLACEHOLDER SPECIALTY",
  since: "PLACEHOLDER YEAR",
};

export const CADENCE = {
  // PLACEHOLDER — the standard working rhythm, same for every client
  rhythm: "PLACEHOLDER — one line on the meeting/update cadence: what happens every week and when.",
  channel: "PLACEHOLDER — where communication lives (email, Slack, Voxer) and the response-time promise.",
  homework: "PLACEHOLDER — what a client needs to bring between calls, and roughly how much time it takes.",
};

export interface FaqItem {
  question: string;
  answer: string;
}

// PLACEHOLDER FAQ — 2-5 items, real objections Zoë actually hears
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "PLACEHOLDER — a question clients usually ask at this stage?",
    answer: "PLACEHOLDER — a plain, honest answer in two or three sentences.",
  },
  {
    question: "What if we need to shift the timeline?",
    answer:
      "PLACEHOLDER — the real flexibility policy in plain words: what's movable, what isn't, how rescheduling works.",
  },
  {
    question: "What do you need from me to start?",
    answer: "PLACEHOLDER — the real short list: signed agreement, deposit, access to whatever the first phase needs.",
  },
];

export interface Testimonial {
  quote: string;
  clientName: string;
  clientBusiness: string;
  // Free-text tags the generator can match against a prospect's
  // industry/situation when picking which 1-2 to show — e.g. "coaching",
  // "ecommerce", "service business", "retention". Optional.
  context?: string;
}

// PLACEHOLDER pool — replace with 2-4 REAL testimonials. Never invent or
// embellish a quote; the generation prompt is told to only pick from
// this pool verbatim, never write its own.
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "PLACEHOLDER — a real testimonial from a past client, ideally one whose project resembles this proposal.",
    clientName: "PLACEHOLDER Past Client Name",
    clientBusiness: "PLACEHOLDER Their Business",
  },
  {
    quote: "PLACEHOLDER — a second real testimonial, shorter is fine, a specific result reads better than general praise.",
    clientName: "PLACEHOLDER Past Client Name",
    clientBusiness: "PLACEHOLDER Their Business",
  },
];

export const FOOTER = {
  businessName: "Falling Forwards",
  website: "zoedew.com",
};
