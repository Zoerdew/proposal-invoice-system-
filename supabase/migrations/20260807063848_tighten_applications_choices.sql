-- Tightens applications' single-select columns now that the real Airtable
-- choice sets are known (fetched from the live "Control Room Application
-- Form" interface, not guessed). Table has zero rows, so safe to add now.

alter table applications
  add constraint applications_annual_turnover_check
    check (annual_turnover in ('Under £50k', '£50k-£100k', '£100k-£150k', '£150k-£250k', '£250k+')),
  add constraint applications_repeat_business_check
    check (repeat_business in ('Mostly one-off', 'Mix of new and returning', 'Mostly returning', 'Not sure')),
  add constraint applications_data_history_check
    check (data_history in ('Less than a year', '1-2 years', '2+ years', 'Not sure')),
  add constraint applications_data_state_check
    check (data_state in ('Clean and organised', 'All there but messy', 'Scattered across places', 'Don''t know what I''ve got')),
  add constraint applications_what_theyre_after_check
    check (what_theyre_after in ('Dig in and show me where to focus', 'Step-by-step plan I follow alone', 'Do the work for me', 'Motivation and accountability')),
  add constraint applications_start_timing_check
    check (start_timing in ('As soon as possible', 'Next month or two', 'Later this year', 'Just exploring')),
  add constraint applications_budget_fit_check
    check (budget_fit in ('Yes, that works', 'Yes, with payment plan', 'Need to think about it')),
  add constraint applications_status_check
    check (status in ('New', 'Reviewing', 'Call booked', 'Accepted', 'Declined', 'Not a fit'));

alter table applications
  alter column status set default 'New';
