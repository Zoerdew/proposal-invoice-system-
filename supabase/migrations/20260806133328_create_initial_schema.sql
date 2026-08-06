create extension if not exists pgcrypto;

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Sales
-- ============================================================

create table offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  description text,
  default_contract_terms text,
  payment_plan_options text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table offer_line_items (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  description text not null,
  kind text check (kind in ('fixed', 'package_option', 'add_on')),
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  business_name text,
  status text,
  start_date timestamptz,
  end_date timestamptz,
  package_price numeric(10,2),
  payment_plan text check (payment_plan in ('Pay in Full', 'Pay in 3', 'Pay in 6')),
  commercial_objectives text,
  notes text,
  portal_token text not null unique,
  target_figure numeric(10,2),
  baseline_monthly_revenue numeric(10,2),
  baseline_repeat_buyer_pct numeric(5,2),
  annual_turnover numeric(10,2),
  baseline_date timestamptz,
  onboarding_complete boolean not null default false,
  proposal_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  email text,
  business_name text,
  website text,
  what_business_does text,
  time_in_business text,
  annual_turnover text,
  main_offers_pricing text,
  top_revenue_offer text,
  repeat_business text,
  tools_used text[] not null default '{}',
  data_history text,
  data_state text,
  what_theyve_tried text,
  biggest_opportunity text,
  slow_week_behaviour text,
  why_now text,
  what_theyre_after text,
  openness_to_evidence text,
  start_timing text,
  budget_fit text,
  anything_else text,
  status text,
  fit_notes_private text,
  submitted_at timestamptz,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_email text not null,
  company text,
  offer_id uuid references offers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'signed', 'invoiced', 'paid')),
  slug text not null unique,
  contract_terms text,
  date_signed timestamptz,
  payment_plan text check (payment_plan in ('Pay in Full', 'Pay in 3', 'Pay in 6')),
  deposit_amount numeric(10,2),
  notes text,
  application_id uuid references applications(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients
  add constraint clients_proposal_id_fkey
  foreign key (proposal_id) references proposals(id) on delete set null;

create table line_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2) not null,
  kind text check (kind in ('fixed', 'package_option', 'add_on')),
  selected boolean not null default false,
  line_total numeric(10,2) generated always as (quantity * unit_price) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table signatures (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  signed_name text not null,
  signed_at timestamptz not null default now(),
  ip_address text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table proposal_invoices (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  sequence integer not null,
  amount numeric(10,2) not null,
  due_date timestamptz not null,
  description text,
  xero_invoice_id text,
  xero_online_invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposal_id, sequence)
);

create table xero_connection (
  id uuid primary key default gen_random_uuid(),
  label text not null unique default 'default',
  tenant_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Delivery
-- ============================================================

create table onboarding (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references clients(id) on delete cascade,
  best_email text,
  best_day_for_checkin text,
  where_revenue_data_lives text,
  biggest_challenge_right_now text,
  why_now text,
  whats_generating_leads_now text,
  six_month_risk text,
  definition_of_success text,
  anything_else text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table client_offers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  price numeric(10,2),
  still_live boolean not null default true,
  delivery_hours numeric(6,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table timeline_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  month timestamptz not null,
  what_happened text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table data_sources (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text,
  period_covered text,
  received_at timestamptz,
  file_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table findings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  type text check (type in ('gain', 'opportunity', 'leak', 'driver')),
  description text,
  value numeric(10,2),
  status text,
  date_found timestamptz,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  date timestamptz not null default now(),
  revenue_this_week numeric(10,2),
  notes text,
  qualitative_notes text,
  felt_like text,
  your_response text,
  responded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table proof (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  text text not null,
  date_added timestamptz,
  type text,
  source text,
  screenshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  decision text not null,
  prompted_by_number text,
  expected text,
  outcome text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  definition text,
  baseline numeric(10,2),
  target numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table metric_readings (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references metrics(id) on delete cascade,
  value numeric(10,2),
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at triggers
-- ============================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'offers', 'offer_line_items', 'clients', 'applications', 'proposals',
      'line_items', 'signatures', 'proposal_invoices', 'xero_connection',
      'onboarding', 'client_offers', 'timeline_events', 'data_sources',
      'findings', 'check_ins', 'proof', 'decisions', 'metrics', 'metric_readings'
    ])
  loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- ============================================================
-- Row level security — all access is server-side via the service
-- role key, which bypasses RLS. No policies are defined, so the
-- anon/authenticated roles get zero rows even if ever exposed.
-- ============================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'offers', 'offer_line_items', 'clients', 'applications', 'proposals',
      'line_items', 'signatures', 'proposal_invoices', 'xero_connection',
      'onboarding', 'client_offers', 'timeline_events', 'data_sources',
      'findings', 'check_ins', 'proof', 'decisions', 'metrics', 'metric_readings'
    ])
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end;
$$;
