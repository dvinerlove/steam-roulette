-- created_at needed for TTL cleanup of old shares
alter table shares add column if not exists created_at timestamptz not null default now();
create index if not exists shares_created_at_idx on shares (created_at);
