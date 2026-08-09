-- V2-BUILD-SPEC.md Phase 10: leads & sales pipeline. Schema mirrors the real
-- "Master Leads Database" table in the "Lead Tracker (Internal)" Airtable
-- base (app0aT8LVhT08kx06), pulled via the Airtable MCP this session, not
-- guessed. lead_stage values are the real Lead Stage single-select choices.
-- products generalises what `offers` does today for every Falling Forwards
-- offer, not just In Control — it does not replace `offers`.

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text,
  source text,
  product_id uuid references products(id),
  lead_stage text not null default 'New'
    check (lead_stage in ('New', 'In Progress', 'Warm', 'Hot', 'Closed - Won', 'Closed - Lost')),
  lead_value numeric(10,2),
  -- Percentage points (0-100), same convention as other numeric fields —
  -- no existing fraction-vs-percent precedent to match either way.
  conversion_probability numeric(5,2),
  notes text,
  first_contact_date date,
  close_date date,
  -- Drives a computed "next contact date" (most recent contact + this many
  -- days) in the admin UI — her follow-up cadence mechanism in Airtable
  -- today, not stored as its own date since it's just an offset.
  days_until_next_contact integer,
  -- Links an In Control applicant into the same pipeline the way
  -- `proposals` already links to `applications`.
  application_id uuid references applications(id),
  -- Set once closed-won and converted to a real client. Not auto-populated
  -- by this phase — that would touch the client-provisioning flow, which
  -- isn't required by Phase 10's scope.
  client_id uuid references clients(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notes Uploaded on Master Leads Database is a multi-file attachments
-- field. No Supabase Storage precedent exists in this app — follows the
-- same @vercel/blob put()-then-store-URL pattern as onboarding uploads
-- (app/api/onboarding/[token]/upload/route.ts), as a child table the same
-- way data_sources is a child table of clients.
create table lead_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  file_url text not null,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mirrors the existing proposals.application_id back-reference, for the
-- same "convert to proposal" pattern applications already use.
alter table proposals add column lead_id uuid references leads(id);

do $$
declare
  t text;
begin
  for t in select unnest(array['products', 'leads', 'lead_attachments'])
  loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()',
      t
    );
    execute format('alter table %I enable row level security', t);
  end loop;
end;
$$;

-- Real current Falling Forwards offers, pulled from the Airtable Offer
-- Table this session (only 2 rows exist there today) — not placeholders.
insert into products (name, price) values
  ('Get Paid Intensive', 397),
  ('In Control', 3300);
