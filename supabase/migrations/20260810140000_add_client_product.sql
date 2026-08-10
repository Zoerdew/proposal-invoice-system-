-- V3-BUILD-SPEC.md Phase 15: generalise the client model beyond In
-- Control. The In-Control-specific columns on clients (target_figure,
-- baseline_*, annual_turnover) are already nullable, so nothing
-- structurally blocked a non-In-Control row before this — the real gap
-- was that nothing linked a client to which Falling Forwards
-- programme/product they're actually in.

alter table clients add column product_id uuid references products(id);

-- Backfill: every existing real client today is an In Control client.
update clients
set product_id = (select id from products where name = 'In Control')
where product_id is null;
