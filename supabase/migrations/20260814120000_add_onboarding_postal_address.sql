-- Lets a client leave a postal address at onboarding so Zoë can send a
-- welcome gift. Optional, like the other free-text onboarding fields.
alter table onboarding
  add column postal_address text;
