-- V3-BUILD-SPEC.md Phase 16 follow-up: the recap page was reusing
-- meeting_notes.summary (Phase 12's admin-facing extraction, written in
-- third person for Zoe's own internal notes) verbatim on the public,
-- client-facing page — wrong voice for something the client reads
-- themselves. recap_summary/recap_focus are the recap's own second-
-- person-voiced fields, kept separate from summary so Phase 12's
-- existing admin behaviour is untouched.

alter table meeting_notes add column recap_summary text;
alter table meeting_notes add column recap_focus text;
