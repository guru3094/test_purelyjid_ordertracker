ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS product_cost NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS advance_paid NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS balance_to_be_paid NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS product_category VARCHAR(50);

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_product_category;

ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_product_category
  CHECK (
    product_category IS NULL
    OR product_category IN ('Workshop', 'Resin Art', 'Raw Materials')
  );

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_product_amounts;

ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_product_amounts
  CHECK (
    (product_cost IS NULL OR product_cost >= 0)
    AND (advance_paid IS NULL OR advance_paid >= 0)
    AND (balance_to_be_paid IS NULL OR balance_to_be_paid >= 0)
  );
