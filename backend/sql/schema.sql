-- NammaPower schema. Privacy rule: no Aadhaar, voter ID, phone or consumer number is stored.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  password_hash text not null,
  display_name text check (char_length(display_name) between 1 and 80),
  profile_photo text check (char_length(profile_photo) <= 500000),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table users add column if not exists display_name text;
alter table users add column if not exists profile_photo text;
do $$ begin
  alter table users add constraint users_display_name_check check (char_length(display_name) between 1 and 80);
exception when duplicate_object then null;
end $$;
alter table users add column if not exists role text not null default 'user';
do $$ begin
  alter table users add constraint users_role_check check (role in ('user', 'admin'));
exception when duplicate_object then null;
end $$;

create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_expiry on sessions (expires_at);

create table if not exists bescom_subdivisions (
  id text primary key,
  division_name text not null,
  subdivision_code text not null unique,
  zone text not null,
  outage_risk_level text not null check (outage_risk_level in ('high', 'medium', 'low')),
  color_code text not null check (color_code in ('#EF4444', '#F59E0B', '#10B981')),
  reliability_score int not null check (reliability_score between 0 and 100),
  avg_weekly_outage_hours numeric(4,1) not null,
  recommended_ups text not null,
  latitude double precision not null,
  longitude double precision not null,
  grid_triggers text,
  boundary_coordinates jsonb
);

create table if not exists bescom_tariff_rates (
  id int primary key,
  category text not null,
  energy_rate numeric(6,2) not null,
  fixed_charge_per_kw numeric(6,2) not null,
  pg_surcharge numeric(6,2) not null,
  fppca numeric(6,2) not null,
  duty_rate numeric(4,3) not null,
  gruha_jyothi_cap int not null,
  dg_rate_min numeric(6,2) not null,
  dg_rate_max numeric(6,2) not null,
  effective_from date not null
);

create table if not exists maintenance_notices (
  id serial primary key,
  subdivision_id text not null references bescom_subdivisions(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  window_start text not null,
  window_end text not null,
  note text,
  unique (subdivision_id, weekday)
);

create table if not exists outage_reports (
  id bigserial primary key,
  subdivision_id text not null references bescom_subdivisions(id),
  device_id uuid not null,
  kind text not null check (kind in ('outage', 'voltage', 'restored')),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists outage_reports_area_time on outage_reports (subdivision_id, created_at desc);

create table if not exists user_appliances (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null,
  name text not null,
  watts int not null check (watts between 1 and 10000),
  daily_runtime_hours numeric(4,1) not null default 1,
  alert_after_minutes int not null default 35,
  created_at timestamptz not null default now()
);

create table if not exists appliance_consumption_alerts (
  id bigserial primary key,
  device_id uuid not null,
  appliance_id uuid references user_appliances(id) on delete set null,
  alert_type text not null check (alert_type in ('long_runtime', 'gruha_jyothi_ceiling', 'slab_warning')),
  triggered_at timestamptz not null default now(),
  est_cost_impact_inr numeric(10,2)
);

create table if not exists user_consumption_and_bills (
  id bigserial primary key,
  device_id uuid not null,
  month date not null,
  units numeric(8,2) not null,
  sanctioned_kw numeric(4,1) not null default 1,
  gruha_jyothi boolean not null default true,
  gross_inr numeric(10,2) not null,
  payable_inr numeric(10,2) not null,
  unique (device_id, month)
);

-- row-level security: the API sets app.device_id inside each transaction
alter table user_appliances enable row level security;
alter table user_appliances force row level security;
alter table appliance_consumption_alerts enable row level security;
alter table appliance_consumption_alerts force row level security;
alter table user_consumption_and_bills enable row level security;
alter table user_consumption_and_bills force row level security;
alter table outage_reports enable row level security;
alter table outage_reports force row level security;

do $$
declare t text;
begin
  foreach t in array array['user_appliances', 'appliance_consumption_alerts', 'user_consumption_and_bills'] loop
    execute format('drop policy if exists own_rows on %I', t);
    execute format(
      'create policy own_rows on %I using (device_id::text = current_setting(''app.device_id'', true)) with check (device_id::text = current_setting(''app.device_id'', true))', t);
  end loop;
end $$;

-- crowd reports are public to read (the API never returns device_id) but only writable as yourself
drop policy if exists reports_read on outage_reports;
drop policy if exists reports_write on outage_reports;
create policy reports_read on outage_reports for select using (true);
create policy reports_write on outage_reports for insert
  with check (device_id::text = current_setting('app.device_id', true));
