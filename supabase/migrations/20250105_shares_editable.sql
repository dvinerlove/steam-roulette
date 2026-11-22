-- Editable "live" shares: owner_hash = sha256 of creator's secret.
-- NULL owner_hash = immutable snapshot (all existing shares stay read-only).
alter table shares add column if not exists owner_hash text;
alter table shares add column if not exists updated_at timestamptz;
