-- V2-BUILD-SPEC.md Phase 14: portal magic-link login. The session/token
-- mechanism itself needs no new table (signed HMAC tokens, verified
-- statelessly) — this table exists only to rate-limit login attempts per
-- portal token, since the existing admin login has no rate limiting and
-- this one is reachable by anyone who knows or guesses a token.

create table portal_login_attempts (
  id uuid primary key default gen_random_uuid(),
  portal_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index portal_login_attempts_token_idx on portal_login_attempts (portal_token, created_at);

create trigger set_updated_at before update on portal_login_attempts
  for each row execute function set_updated_at();
alter table portal_login_attempts enable row level security;
