-- Real choice set fetched from the live Control Room "Clients" table
-- (fld48pAgAdVG2Eskq), not guessed. The one existing row is the persistent
-- demo client with status null, which a CHECK constraint doesn't touch.
alter table clients
  add constraint clients_status_check
    check (status in ('Onboarding', 'Active', 'Wrapping up', 'Complete', 'Paused'));
