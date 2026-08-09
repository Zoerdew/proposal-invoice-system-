// Pure constants and types only — no database import, safe to import from
// client components, same reasoning as applicationChoices.ts.

// Real Lead Stage single-select choices from the live "Master Leads
// Database" table (Airtable base "Lead Tracker (Internal)") — fetched via
// the Airtable MCP, not guessed.
export const LEAD_STAGE_OPTIONS = [
  "New",
  "In Progress",
  "Warm",
  "Hot",
  "Closed - Won",
  "Closed - Lost",
] as const;

export type LeadStage = (typeof LEAD_STAGE_OPTIONS)[number];
