CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.orders (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id VARCHAR(50) NOT NULL UNIQUE,

    customer_name VARCHAR(255) NOT NULL,

    mobile_number VARCHAR(20) NOT NULL,

    email VARCHAR(255),

    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    fulfillment_method VARCHAR(20) NOT NULL
        CHECK (fulfillment_method IN ('Pickup','Delivery')),

    status_id UUID NOT NULL,

    courier_id UUID,

    tracking_number VARCHAR(100),

    expected_delivery_date TIMESTAMPTZ,

    remarks TEXT,

    last_sheet_updated TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_status
        FOREIGN KEY(status_id)
        REFERENCES public.order_status_master(id),

    CONSTRAINT fk_courier
        FOREIGN KEY(courier_id)
        REFERENCES public.courier_master(id),

    CONSTRAINT chk_pickup_delivery
    CHECK (

        (
            fulfillment_method='Pickup'
            AND courier_id IS NULL
            AND tracking_number IS NULL
        )

        OR

        (
            fulfillment_method='Delivery'
        )

    )

);

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN

    NEW.updated_at = NOW();

    RETURN NEW;

END;

$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orders_updated_at

BEFORE UPDATE

ON public.orders

FOR EACH ROW

EXECUTE FUNCTION update_orders_updated_at();
