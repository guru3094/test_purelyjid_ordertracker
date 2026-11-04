CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.courier_master (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    courier_code VARCHAR(50) NOT NULL UNIQUE,

    courier_name VARCHAR(100) NOT NULL,

    website VARCHAR(255),

    tracking_url VARCHAR(500),

    support_email VARCHAR(255),

    support_phone VARCHAR(30),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_courier_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_courier_master_updated_at
BEFORE UPDATE
ON public.courier_master
FOR EACH ROW
EXECUTE FUNCTION update_courier_master_updated_at();
