ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sync_execution ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sync_checkpoint ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.application_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.order_status_master ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courier_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_orders
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_order_history
ON public.order_status_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_sync_execution
ON public.sync_execution
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_sync_checkpoint
ON public.sync_checkpoint
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_application_config
ON public.application_config
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_audit_log
ON public.audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_status_master
ON public.order_status_master
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY service_role_all_courier_master
ON public.courier_master
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
