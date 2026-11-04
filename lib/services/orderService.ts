import {
  findOrderByOrderId,
  getPaginatedOrders,
} from "@/lib/supabase/ordersRepository";

import { mapOrderResponse } from "@/lib/mappers/orderResponseMapper";
import { ApiError } from "@/lib/errors/ApiError";
import {
  OrderSearchRequest,
  SortOrder,
} from "@/lib/models/OrderSearchRequest";

import {
  validateCourier,
  validateFulfillmentMethod,
  validateStatus,
} from "@/lib/services/masterDataService";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

const DEFAULT_SORT_BY = "orderDate";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

const ALLOWED_SORT_FIELDS = [
  "orderDate",
  "customerName",
  "status",
  "courier",
  "createdAt",
] as const;

const ALLOWED_SORT_ORDERS: SortOrder[] = [
  "asc",
  "desc",
];

type AllowedSortField =
  (typeof ALLOWED_SORT_FIELDS)[number];

function validateSortBy(
  sortBy?: string
): AllowedSortField {
  const normalizedSortBy =
    sortBy?.trim() || DEFAULT_SORT_BY;

  const isAllowed = ALLOWED_SORT_FIELDS.includes(
    normalizedSortBy as AllowedSortField
  );

  if (!isAllowed) {
    throw new ApiError(
      `Invalid sortBy. Allowed values: ${ALLOWED_SORT_FIELDS.join(
        ", "
      )}`,
      400
    );
  }

  return normalizedSortBy as AllowedSortField;
}

function validateSortOrder(
  sortOrder?: string
): SortOrder {
  const normalizedSortOrder =
    sortOrder?.trim().toLowerCase() ||
    DEFAULT_SORT_ORDER;

  const isAllowed = ALLOWED_SORT_ORDERS.includes(
    normalizedSortOrder as SortOrder
  );

  if (!isAllowed) {
    throw new ApiError(
      `Invalid sortOrder. Allowed values: ${ALLOWED_SORT_ORDERS.join(
        ", "
      )}`,
      400
    );
  }

  return normalizedSortOrder as SortOrder;
}

export async function getOrders(
  request: Partial<OrderSearchRequest> = {}
) {
  const page = request.page ?? DEFAULT_PAGE;
  const pageSize =
    request.pageSize ?? DEFAULT_PAGE_SIZE;

  const searchTerm = request.q?.trim();

  if (!Number.isInteger(page) || page < 1) {
    throw new ApiError(
      "page must be a positive integer",
      400
    );
  }

  if (
    !Number.isInteger(pageSize) ||
    pageSize < 1
  ) {
    throw new ApiError(
      "pageSize must be a positive integer",
      400
    );
  }

  if (pageSize > MAX_PAGE_SIZE) {
    throw new ApiError(
      `pageSize cannot be greater than ${MAX_PAGE_SIZE}`,
      400
    );
  }

  if (
    searchTerm &&
    searchTerm.length > MAX_SEARCH_LENGTH
  ) {
    throw new ApiError(
      `q cannot be greater than ${MAX_SEARCH_LENGTH} characters`,
      400
    );
  }

  const sortBy = validateSortBy(request.sortBy);

  const sortOrder = validateSortOrder(
    request.sortOrder
  );

  const [status, fulfillmentMethod, courier] =
    await Promise.all([
      validateStatus(request.status),

      validateFulfillmentMethod(
        request.fulfillmentMethod
      ),

      validateCourier(request.courier),
    ]);

  const orderSearchRequest: OrderSearchRequest = {
    page,
    pageSize,
    q: searchTerm || undefined,
    status,
    fulfillmentMethod,
    courier,
    sortBy,
    sortOrder,
  };

  const { orders, totalRecords } =
    await getPaginatedOrders(
      orderSearchRequest
    );

  const totalPages =
    totalRecords === 0
      ? 0
      : Math.ceil(totalRecords / pageSize);

  return {
    success: true,
    page,
    pageSize,
    query: searchTerm || null,

    filters: {
      status: status || null,
      fulfillmentMethod:
        fulfillmentMethod || null,
      courier: courier || null,
    },

    sorting: {
      sortBy,
      sortOrder,
    },

    totalRecords,
    totalPages,

    orders: orders.map(mapOrderResponse),
  };
}

export async function getOrderById(
  orderId: string
) {
  const normalizedOrderId = orderId.trim();

  if (!normalizedOrderId) {
    throw new ApiError(
      "orderId is required",
      400
    );
  }

  const order = await findOrderByOrderId(
    normalizedOrderId
  );

  if (!order) {
    throw new ApiError(
      "Order not found",
      404
    );
  }

  return {
    success: true,
    order: mapOrderResponse(order),
  };
}
