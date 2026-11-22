create table if not exists rate_limits (
  key text primary key,
  count int not null default 0,
  window_start timestamptz not null default now()
);

-- Service role bypasses RLS; table is written only by the edge function.
alter table rate_limits enable row level security;
