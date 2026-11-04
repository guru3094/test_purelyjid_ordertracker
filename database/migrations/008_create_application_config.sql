CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.application_config (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    config_key VARCHAR(100) NOT NULL UNIQUE,

    config_value TEXT NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_application_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_config_updated_at
BEFORE UPDATE
ON public.application_config
FOR EACH ROW
EXECUTE FUNCTION update_application_config_updated_at();
