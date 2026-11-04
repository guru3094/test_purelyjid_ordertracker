INSERT INTO public.order_status_master
    (status_code, status_name, fulfillment_method, display_order, is_active)
VALUES
('ORDER_RECEIVED', 'Order Received', 'Both', 1, TRUE),
('PAYMENT_PENDING', 'Payment Pending', 'Both', 1, TRUE),
('PHOTO_PENDING', 'Photo Pending', 'Both', 1, TRUE),
('PHOTO_RECEIVED', 'Photo Received', 'Both', 2, TRUE),
('ORDER_CONFIRMED', 'Order Confirmed', 'Both', 2, TRUE),
('PREPARING', 'Preparing', 'Both', 2, TRUE),
('PROCESSING', 'Processing', 'Both', 3, TRUE),
('DESIGN_APPROVAL_PENDING', 'Design Approval Pending', 'Both', 2, TRUE),
('CUSTOMER_APPROVAL_PENDING', 'Customer Approval Pending', 'Both', 2, TRUE),
('DESIGN_APPROVED', 'Design Approved', 'Both', 2, TRUE),
('DESIGN_IN_PROGRESS', 'Design In Progress', 'Both', 3, TRUE),
('PRODUCTION_IN_PROGRESS', 'Production In Progress', 'Both', 3, TRUE),
('RESIN_CASTING_IN_PROGRESS', 'Resin Casting In Progress', 'Both', 3, TRUE),
('FINISHING_IN_PROGRESS', 'Finishing In Progress', 'Both', 3, TRUE),
('QUALITY_CHECK', 'Quality Check', 'Both', 3, TRUE),
('PACKAGING_IN_PROGRESS', 'Packaging In Progress', 'Both', 3, TRUE),
('PACKED', 'Packed', 'Delivery', 3, TRUE),
('READY_FOR_PICKUP', 'Ready For Pickup', 'Pickup', 3, TRUE),
('PICKED_UP', 'Picked Up', 'Pickup', 6, TRUE),
('READY_FOR_DISPATCH', 'Ready For Dispatch', 'Delivery', 4, TRUE),
('DISPATCHED', 'Dispatched', 'Delivery', 4, TRUE),
('SHIPPED', 'Shipped', 'Delivery', 4, TRUE),
('READY_FOR_DELIVERY', 'Ready For Delivery', 'Delivery', 5, TRUE),
('OUT_FOR_DELIVERY', 'Out For Delivery', 'Delivery', 5, TRUE),
('DELIVERED', 'Delivered', 'Delivery', 6, TRUE),
('COMPLETED', 'Completed', 'Both', 6, TRUE),
('CANCELLED', 'Cancelled', 'Both', 99, TRUE)
ON CONFLICT (status_code) DO UPDATE SET
    status_name = EXCLUDED.status_name,
    fulfillment_method = EXCLUDED.fulfillment_method,
    display_order = EXCLUDED.display_order,
    is_active = TRUE;

INSERT INTO public.courier_master
(
    courier_code,
    courier_name,
    website,
    tracking_url,
    support_email,
    support_phone
)
VALUES

(
'DTDC',
'DTDC',
'https://www.dtdc.in',
'https://www.dtdc.in/tracking',
NULL,
NULL
),

(
'BLUEDART',
'Blue Dart',
'https://www.bluedart.com',
'https://www.bluedart.com/tracking',
NULL,
NULL
),

(
'DELHIVERY',
'Delhivery',
'https://www.delhivery.com',
'https://www.delhivery.com/tracking',
NULL,
NULL
),

(
'INDIA_POST',
'India Post',
'https://www.indiapost.gov.in',
'https://www.indiapost.gov.in',
NULL,
NULL
),

(
'XPRESSBEES',
'XpressBees',
'https://www.xpressbees.com',
'https://www.xpressbees.com',
NULL,
NULL
),

(
'EKART',
'Ekart',
NULL,
NULL,
NULL,
NULL
);

INSERT INTO public.sync_checkpoint
(
    checkpoint_name,
    last_successful_sync
)
VALUES
(
    'GOOGLE_SHEETS_SYNC',
    NULL
);

INSERT INTO public.application_config
(
    config_key,
    config_value,
    description
)
VALUES

(
'APPLICATION_NAME',
'PurelyJid Order Tracker',
'Application display name'
),

(
'SYNC_INTERVAL_MINUTES',
'5',
'Polling interval in minutes'
),

(
'ENABLE_SYNC',
'true',
'Enable or disable Google Sheets synchronization'
),

(
'MAINTENANCE_MODE',
'false',
'Enable maintenance mode'
),

(
'DEFAULT_COUNTRY',
'India',
'Default country for courier tracking'
);
