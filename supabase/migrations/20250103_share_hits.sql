-- Track share usage so dead links (never opened) are identifiable
alter table shares add column if not exists hits int not null default 0;
alter table shares add column if not exists last_accessed_at timestamptz;
