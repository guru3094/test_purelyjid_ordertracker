CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.sync_checkpoint (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    checkpoint_name VARCHAR(100) NOT NULL UNIQUE,

    last_successful_sync TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_sync_checkpoint_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_checkpoint_updated_at
BEFORE UPDATE
ON public.sync_checkpoint
FOR EACH ROW
EXECUTE FUNCTION update_sync_checkpoint_updated_at();
