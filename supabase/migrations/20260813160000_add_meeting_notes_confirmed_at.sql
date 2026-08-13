-- Recap confirm CTA: a client reading a sales-call recap can click
-- "Confirm you want to go ahead", which emails Zoë and records when it
-- happened. Lives on meeting_notes rather than a new table for the same
-- reason recap_slug/recap_summary do — this is more detail about the
-- same call, not a new entity.

alter table meeting_notes add column confirmed_at timestamptz;
