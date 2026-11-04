CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.order_status_master (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    status_code VARCHAR(50) NOT NULL UNIQUE,

    status_name VARCHAR(100) NOT NULL,

    fulfillment_method VARCHAR(20) NOT NULL
        CHECK (fulfillment_method IN ('Pickup','Delivery','Both')),

    display_order INTEGER NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_order_status_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_status_master_updated_at
BEFORE UPDATE
ON public.order_status_master
FOR EACH ROW
EXECUTE FUNCTION update_order_status_master_updated_at();
