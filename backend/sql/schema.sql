-- Idempotent: safe to run on every deploy.
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  display_name  text,
  profile_photo text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  created_at    timestamptz not null default now()
);

create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_idx on sessions (user_id);
create index if not exists sessions_expires_idx on sessions (expires_at);

create table if not exists bescom_subdivisions (
  id                      text primary key,
  division_name           text not null,
  subdivision_code        text not null unique,
  zone                    text,
  outage_risk_level       text not null check (outage_risk_level in ('low', 'medium', 'high')),
  color_code              text,
  reliability_score       int,
  avg_weekly_outage_hours numeric(5, 1) not null default 0,
  recommended_ups         text,
  latitude                double precision,
  longitude               double precision,
  grid_triggers           text,
  boundary_coordinates    jsonb
);

create table if not exists bescom_tariff_rates (
  id                  int primary key,
  category            text not null,
  energy_rate         numeric(8, 2) not null,
  fixed_charge_per_kw numeric(8, 2) not null,
  pg_surcharge        numeric(8, 2) not null,
  fppca               numeric(8, 2) not null,
  duty_rate           numeric(6, 4) not null,
  gruha_jyothi_cap    int,
  dg_rate_min         numeric(8, 2),
  dg_rate_max         numeric(8, 2),
  effective_from      date
);

create table if not exists maintenance_notices (
  id             bigserial primary key,
  subdivision_id text not null references bescom_subdivisions(id) on delete cascade,
  weekday        int not null check (weekday between 0 and 6),
  window_start   time,
  window_end     time,
  note           text,
  unique (subdivision_id, weekday)
);

-- Entered by an admin with a source link. Kept apart from community reports.
create table if not exists official_notices (
  id             bigserial primary key,
  subdivision_id text not null references bescom_subdivisions(id) on delete cascade,
  kind           text not null check (kind in ('planned', 'unplanned', 'advisory')),
  description    text not null,
  starts_at      timestamptz,
  ends_at        timestamptz,
  source_name    text not null,
  source_url     text not null,
  published_at   timestamptz not null default now()
);
create index if not exists official_notices_area_idx on official_notices (subdivision_id, published_at desc);

create table if not exists community_reports (
  id             bigserial primary key,
  subdivision_id text not null references bescom_subdivisions(id) on delete cascade,
  kind           text not null check (kind in ('outage', 'voltage', 'restored')),
  note           text,
  area_label     text,
  started_at     timestamptz,
  device_id      text not null,
  user_id        uuid references users(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists community_reports_area_idx on community_reports (subdivision_id, created_at desc);
create index if not exists community_reports_device_idx on community_reports (device_id, created_at desc);

create table if not exists alerts (
  id                  bigserial primary key,
  device_id           text not null,
  user_id             uuid references users(id) on delete set null,
  alert_type          text not null,
  est_cost_impact_inr numeric(12, 2),
  created_at          timestamptz not null default now()
);
