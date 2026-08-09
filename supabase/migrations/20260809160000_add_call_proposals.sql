-- V2-BUILD-SPEC.md Phase 11: call-transcript proposal generator. A
-- separate, private one-pager document type — does not touch proposals,
-- signing, or Xero. status is plain text with no CHECK constraint yet,
-- same "create loose, tighten once real usage is known" pattern already
-- used for applications.status and clients.status; not surfaced as an
-- editable field in the admin this phase.

create table call_proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  prospect_name text not null,
  call_date date,
  currency text not null default 'GBP',
  transcript text not null,
  generated_html text,
  slug text not null unique,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on call_proposals
  for each row execute function set_updated_at();
alter table call_proposals enable row level security;
