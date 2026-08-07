// Pure constants and types only — no database import. This file is safe to
// import from client components (e.g. ApplyForm); lib/db/applications.ts
// re-exports everything here for server-side consumers, but importing the
// db-touching module from a client component would pull the server-only
// Supabase client into the browser bundle.

// Exact choice sets from the live "Control Room Application Form" Airtable
// interface — not guessed, fetched from the real field schema.
export const ANNUAL_TURNOVER_OPTIONS = [
  "Under £50k",
  "£50k-£100k",
  "£100k-£150k",
  "£150k-£250k",
  "£250k+",
] as const;

export const REPEAT_BUSINESS_OPTIONS = [
  "Mostly one-off",
  "Mix of new and returning",
  "Mostly returning",
  "Not sure",
] as const;

export const TOOLS_USED_OPTIONS = [
  "Stripe",
  "PayPal",
  "ThriveCart",
  "CRM",
  "Email platform",
  "Booking/scheduling",
  "Spreadsheets",
  "Other",
] as const;

export const DATA_HISTORY_OPTIONS = ["Less than a year", "1-2 years", "2+ years", "Not sure"] as const;

export const DATA_STATE_OPTIONS = [
  "Clean and organised",
  "All there but messy",
  "Scattered across places",
  "Don't know what I've got",
] as const;

export const WHAT_THEYRE_AFTER_OPTIONS = [
  "Dig in and show me where to focus",
  "Step-by-step plan I follow alone",
  "Do the work for me",
  "Motivation and accountability",
] as const;

export const START_TIMING_OPTIONS = [
  "As soon as possible",
  "Next month or two",
  "Later this year",
  "Just exploring",
] as const;

export const BUDGET_FIT_OPTIONS = ["Yes, that works", "Yes, with payment plan", "Need to think about it"] as const;

export const APPLICATION_STATUS_OPTIONS = [
  "New",
  "Reviewing",
  "Call booked",
  "Accepted",
  "Declined",
  "Not a fit",
] as const;

export type AnnualTurnover = (typeof ANNUAL_TURNOVER_OPTIONS)[number];
export type RepeatBusiness = (typeof REPEAT_BUSINESS_OPTIONS)[number];
export type ToolUsed = (typeof TOOLS_USED_OPTIONS)[number];
export type DataHistory = (typeof DATA_HISTORY_OPTIONS)[number];
export type DataState = (typeof DATA_STATE_OPTIONS)[number];
export type WhatTheyreAfter = (typeof WHAT_THEYRE_AFTER_OPTIONS)[number];
export type StartTiming = (typeof START_TIMING_OPTIONS)[number];
export type BudgetFit = (typeof BUDGET_FIT_OPTIONS)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUS_OPTIONS)[number];
