// Pure constants/types, no database import — safe for client components.
// See lib/db/applicationChoices.ts for why this split exists.

// Real choice set from the live Control Room "Clients" table, not guessed.
export const CLIENT_STATUS_OPTIONS = [
  "Onboarding",
  "Active",
  "Wrapping up",
  "Complete",
  "Paused",
] as const;
export type ClientStatus = (typeof CLIENT_STATUS_OPTIONS)[number];

export const CHECKIN_DAY_OPTIONS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export type CheckinDay = (typeof CHECKIN_DAY_OPTIONS)[number];

export const REVENUE_DATA_SOURCE_OPTIONS = [
  "Stripe",
  "Other platform",
  "They'll send me reports",
] as const;
export type RevenueDataSource = (typeof REVENUE_DATA_SOURCE_OPTIONS)[number];

export const FINDING_TYPE_OPTIONS = ["Gain", "Opportunity", "Leak", "Driver"] as const;
export const FINDING_STATUS_OPTIONS = ["Identified", "In Progress", "Fixed", "Banked"] as const;
export type FindingStatusChoice = (typeof FINDING_STATUS_OPTIONS)[number];

export const FELT_LIKE_OPTIONS = ["Ahead", "On track", "Behind"] as const;
export const PROOF_TYPE_OPTIONS = ["Testimonial", "Thank You", "Unprompted Praise"] as const;
