-- Same confirm-CTA mechanism as meeting_notes.confirmed_at, for the
-- call-proposal flow (Phase 11) instead — a prospect reading their
-- proposal at /p/[slug] can confirm they want to go ahead, which emails
-- Zoë and records when it happened.

alter table call_proposals add column confirmed_at timestamptz;
