-- V3-BUILD-SPEC.md Phase 16: public call-recap page. Publishing a recap
-- enriches and exposes an existing meeting_notes row rather than creating
-- a parallel entity — next-steps are already `todos` rows tied to
-- meeting_note_id (Phase 12), so there's nothing left for a recap to own
-- except the extra structured detail Phase 12's extraction doesn't
-- capture (decisions reached, topic-by-topic breakdown) and the
-- publishing state itself.

alter table meeting_notes add column decisions jsonb;
alter table meeting_notes add column details jsonb;
alter table meeting_notes add column recap_slug text unique;
alter table meeting_notes add column recap_published_at timestamptz;
