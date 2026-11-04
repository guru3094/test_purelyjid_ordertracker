CREATE INDEX idx_orders_order_id
ON public.orders(order_id);

CREATE INDEX idx_orders_mobile
ON public.orders(mobile_number);

CREATE INDEX idx_orders_status
ON public.orders(status_id);

CREATE INDEX idx_orders_fulfillment
ON public.orders(fulfillment_method);

CREATE INDEX idx_orders_last_sheet_updated
ON public.orders(last_sheet_updated);

CREATE INDEX idx_order_history_order
ON public.order_status_history(order_id);

CREATE INDEX idx_order_history_status
ON public.order_status_history(status_id);

CREATE INDEX idx_order_history_date
ON public.order_status_history(status_changed_at);

CREATE INDEX idx_sync_execution_status
ON public.sync_execution(status);

CREATE INDEX idx_sync_execution_start
ON public.sync_execution(execution_start);

CREATE INDEX idx_audit_log_event_type
ON public.audit_log(event_type);

CREATE INDEX idx_audit_log_created_at
ON public.audit_log(created_at);

CREATE INDEX idx_audit_log_entity
ON public.audit_log(entity_name, entity_id);

