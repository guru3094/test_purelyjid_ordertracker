-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id VARCHAR(30) NOT NULL UNIQUE,

    customer_name VARCHAR(150) NOT NULL,

    mobile_number VARCHAR(20) NOT NULL,

    email VARCHAR(150),

    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    fulfillment_method VARCHAR(20) NOT NULL
        CHECK (fulfillment_method IN ('Pickup','Delivery')),

    status VARCHAR(50) NOT NULL,

    courier_partner VARCHAR(100),

    tracking_number VARCHAR(100),

    remarks TEXT,

    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_delivery_fields
    CHECK (
        (
            fulfillment_method='Pickup'
            AND courier_partner IS NULL
            AND tracking_number IS NULL
        )
        OR
        (
            fulfillment_method='Delivery'
        )
    )
);

-- Indexes

CREATE INDEX idx_orders_order_id
ON public.orders(order_id);

CREATE INDEX idx_orders_mobile
ON public.orders(mobile_number);

CREATE INDEX idx_orders_status
ON public.orders(status);

CREATE INDEX idx_orders_last_updated
ON public.orders(last_updated);

-- Trigger function

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_updated
BEFORE UPDATE
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
