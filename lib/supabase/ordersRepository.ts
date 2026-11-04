import { supabase } from "./client";

import { DbOrder } from "@/lib/mappers/orderMapper";
import {
  OrderSearchRequest,
  SortOrder,
} from "@/lib/models/OrderSearchRequest";

const BASE_ORDER_FIELDS = `
  order_id,
  customer_name,
  mobile_number,
  email,
  order_date,
  fulfillment_method,
  tracking_number,
  expected_delivery_date,
  remarks,
  product_name,
  product_cost,
  advance_paid,
  balance_to_be_paid,
  product_category,
  created_at,
  updated_at
`;

const ORDER_SELECT = `
  ${BASE_ORDER_FIELDS},
  order_status_master (
    status_code,
    display_order
  ),
  courier_master (
    courier_name
  )
`;

function buildOrderSelect(
  status?: string,
  courier?: string,
  sortBy?: string
): string {
  const requiresStatusInnerJoin =
    Boolean(status) || sortBy === "status";

  const requiresCourierInnerJoin =
    Boolean(courier) || sortBy === "courier";

  const statusRelation = requiresStatusInnerJoin
    ? `
        order_status_master:order_status_master!inner (
          status_code,
          display_order
        )
      `
    : `
        order_status_master (
          status_code,
          display_order
        )
      `;

  const courierRelation = requiresCourierInnerJoin
    ? `
        courier_master:courier_master!inner (
          courier_name
        )
      `
    : `
        courier_master (
          courier_name
        )
      `;

  return `
    ${BASE_ORDER_FIELDS},
    ${statusRelation},
    ${courierRelation}
  `;
}

function applyOrderSorting<
  T extends {
    order: (
      column: string,
      options?: {
        ascending?: boolean;
        nullsFirst?: boolean;
      }
    ) => T;
  },
>(
  query: T,
  sortBy?: string,
  sortOrder?: SortOrder
): T {
  const ascending = sortOrder === "asc";

  switch (sortBy) {
    case "customerName":
      return query
        .order("customer_name", {
          ascending,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });

    case "status":
      return query
        .order(
          "order_status_master(display_order)",
          {
            ascending,
            nullsFirst: false,
          }
        )
        .order("created_at", {
          ascending: false,
        });

    case "courier":
      return query
        .order(
          "courier_master(courier_name)",
          {
            ascending,
            nullsFirst: false,
          }
        )
        .order("created_at", {
          ascending: false,
        });

    case "createdAt":
      return query.order("created_at", {
        ascending,
        nullsFirst: false,
      });

    case "orderDate":
    default:
      return query
        .order("order_date", {
          ascending,
          nullsFirst: false,
        })
        .order("created_at", {
          ascending: false,
        });
  }
}

export async function findOrderByOrderId(
  orderId: string
) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function findOrderForCustomer(
  orderId: string,
  mobileNumber: string
) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("order_id", orderId)
    .eq("mobile_number", mobileNumber)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertOrder(
  order: DbOrder
) {
  const { data, error } = await supabase
    .from("orders")
    .insert(order)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateOrder(
  orderId: string,
  order: Partial<DbOrder>
) {
  const { data, error } = await supabase
    .from("orders")
    .update(order)
    .eq("order_id", orderId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function getPaginatedOrders({
  page,
  pageSize,
  q,
  status,
  fulfillmentMethod,
  courier,
  sortBy,
  sortOrder,
}: OrderSearchRequest) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const selectQuery = buildOrderSelect(
    status,
    courier,
    sortBy
  );

  let query = supabase
    .from("orders")
    .select(selectQuery, {
      count: "exact",
    });

  if (q) {
    const sanitizedSearchTerm = q
      .replace(/,/g, "")
      .replace(/\(/g, "")
      .replace(/\)/g, "");

    query = query.or(
      [
        `order_id.ilike.%${sanitizedSearchTerm}%`,
        `customer_name.ilike.%${sanitizedSearchTerm}%`,
        `mobile_number.ilike.%${sanitizedSearchTerm}%`,
        `email.ilike.%${sanitizedSearchTerm}%`,
      ].join(",")
    );
  }

  if (status) {
    query = query.ilike(
      "order_status_master.status_code",
      status
    );
  }

  if (fulfillmentMethod) {
    query = query.ilike(
      "fulfillment_method",
      fulfillmentMethod
    );
  }

  if (courier) {
    query = query.ilike(
      "courier_master.courier_name",
      courier
    );
  }

  const sortedQuery = applyOrderSorting(
    query,
    sortBy,
    sortOrder
  );

  const { data, error, count } =
    await sortedQuery.range(from, to);

  if (error) {
    throw error;
  }

  return {
    orders: data ?? [],
    totalRecords: count ?? 0,
  };
}
