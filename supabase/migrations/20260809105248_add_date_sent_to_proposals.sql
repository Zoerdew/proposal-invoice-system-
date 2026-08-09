-- Phase 8 walkthrough: "Date Sent" existed on the Airtable Proposals table
-- (when marked Sent) but was never ported — only Date Signed survived.
alter table proposals
  add column date_sent date;
