-- Phase 7: extends onboarding intake with what the GOLD Report needs and
-- the current form misses. where_revenue_data_lives already covers "where
-- sales data lives" from BUILD-SPEC.md's list, so not duplicated here.
alter table onboarding
  add column payment_processors text,
  add column email_platform text,
  add column subscriber_count integer,
  add column where_enquiries_live text,
  add column analytics_access text,
  add column off_the_table text,
  add column what_theyve_tried_and_ruled_out text,
  add column own_theory text;
