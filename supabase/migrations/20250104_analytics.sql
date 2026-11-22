create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event text not null check (event in ('visit', 'spin', 'share')),
  visitor text,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_created_at_idx on analytics_events (created_at);
alter table analytics_events enable row level security;
