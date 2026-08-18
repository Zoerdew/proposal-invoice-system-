// Content for the sections of a generated call proposal that don't vary
// by prospect — Zoë's own bio/cadence/FAQ/testimonials. Confirmed with
// her (2026-08-18): these are written once and reused verbatim on every
// generated proposal, rather than regenerated per prospect.
//
// ABOUT/CADENCE/FAQ are Zoë's real copy (supplied 2026-08-18), condensed
// to fit each template slot — see the comment above each one for what
// was trimmed. TESTIMONIALS is deliberately empty; see its own comment.

export const ABOUT = {
  photoUrl: "https://zoedew.com/wp-content/uploads/2025/10/Zoe-Headshot.png" as string | null,
  // Condensed from Zoë's real "About Zoë" copy to fit the template's 2-3
  // sentence slot — full version lives in her onboarding/website copy.
  bio: "Zoë has run Falling Forwards since 2017, working with established service business owners — usually £100k to £150k — who want to grow towards £250k without automatically adding more hours, launches or content. Her speciality is revenue diagnostics: getting properly inside the business to work out what actually deserves attention next, rather than deciding the answer before she's looked.",
  basedIn: "Lancashire, UK",
  specialty: "Revenue diagnostics",
  since: "2017",
};

// Condensed from Zoë's real "What working together looks like" and
// "Your weekly check-in" copy.
export const CADENCE = {
  rhythm:
    "A 90-minute kickoff, then five 60-minute strategy calls across 90 days — the final call maps out the next six to twelve months, so you're not left thinking \"lovely, now what?\"",
  channel:
    "Voxer, Monday to Thursday. Send anything as it comes up — a decision, a weird number, a moment where you have no idea what's happening — and I'll reply within one working day.",
  homework:
    "A short weekly check-in (15-20 minutes: revenue, how the week felt, what changed, anything to flag) and keeping the decision log updated whenever we make or change something important.",
};

export interface FaqItem {
  question: string;
  answer: string;
}

// Zoë's real FAQ copy, lightly trimmed for length.
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need this, or would a sales membership make more sense?",
    answer:
      "Possibly either — they do different things. Most sales memberships focus on the sales activity itself: more leads, better conversion, more conversations, more sales. In Control goes underneath that first. Before deciding you need more leads, I want to know why. Sometimes the answer is that you genuinely need more people — fine, let's go get them. Other times there's something much more useful sitting somewhere else. That's the difference.",
  },
  {
    question: "What if I'm not ready to start straight away?",
    answer:
      "That's completely fine. If you want to hold your place, the deposit is £500. If you're planning to start within the next month, you can make your first payment instead and we'll get your exact start date booked in.",
  },
  {
    question: "What do you need from me before we start?",
    answer:
      "One onboarding form and about an hour of your time. I'll ask about where the business is now, your offers, the last twelve months month by month, where your data lives, what you've already tried, and anything that's firmly off the table — enough of the actual business in front of me that we're not spending the first call guessing.",
  },
  {
    question: "Can't I just do this myself?",
    answer:
      "Eventually, yes — that's very much the point. I don't want you finishing the 90 days feeling like you need me every time the numbers do something weird. By the end, you should be much better at looking at what's happening in the business and making decisions because the evidence gives you a reason to. I'm just going to be extremely nosy about your business for 90 days first.",
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

// Empty for now — the 13 quote-style entries in the Proof Bank (Airtable)
// are either marked "Private Use Only" or unreviewed ("Unknown"
// permission status), and the reviewed ones are Reps Club community
// messages about a different offer, not client feedback on the
// revenue-diagnostic work this proposal sells. Checked 2026-08-18, don't
// re-pull from that base without a permission field actually indicating
// public/cleared use. An empty pool is handled gracefully already — the
// generator picks 0-2 by fit and the Proof section is simply omitted
// when none apply, rather than showing a placeholder or a mismatched
// quote. Add real, on-topic, cleared testimonials here when Zoë has them.
export const TESTIMONIALS: Testimonial[] = [];

export const FOOTER = {
  businessName: "Falling Forwards",
  website: "zoedew.com",
};
