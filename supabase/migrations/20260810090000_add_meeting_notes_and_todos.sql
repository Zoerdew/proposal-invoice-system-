-- V2-BUILD-SPEC.md Phase 12: Google Doc -> meeting notes + to-dos.
-- match_status distinguishes an auto-matched note from a genuinely
-- ambiguous one (title matches more than one real client) that needs a
-- manual admin call — a title matching zero clients is never inserted at
-- all (most of the shared "Meet Recordings" Drive folder isn't In Control
-- related), so there's no third "unmatched" state to represent here.

create table meeting_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  doc_id text not null unique,
  doc_url text not null,
  doc_title text not null,
  raw_content text not null,
  summary text,
  match_status text not null default 'Matched'
    check (match_status in ('Matched', 'Needs matching')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- No client_id of its own — always reached through meeting_note_id, so
-- there's nothing to keep in sync if a note gets manually re-matched.
create table todos (
  id uuid primary key default gen_random_uuid(),
  meeting_note_id uuid not null references meeting_notes(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on meeting_notes
  for each row execute function set_updated_at();
create trigger set_updated_at before update on todos
  for each row execute function set_updated_at();
alter table meeting_notes enable row level security;
alter table todos enable row level security;
