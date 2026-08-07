-- first_name/last_name added specifically for email personalization
-- (Phase 5). proposals.client_name stays a single field — it feeds the
-- legal contract text as one string and nothing asked to split that.
alter table clients
  add column first_name text,
  add column last_name text;
