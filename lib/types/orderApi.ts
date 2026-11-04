export type SortOrder = "asc" | "desc";

export type OrderSortField =
  | "orderDate"
  | "customerName"
  | "status"
  | "courier"
  | "createdAt";

export interface OrderResponse {
  orderId: string;
  customerName: string;
  mobileNumber: string | null;
  email: string | null;
  orderDate: string | null;
  fulfillmentMethod: string;
  status: string | null;
  courier: string | null;
  trackingNumber: string | null;
  expectedDeliveryDate: string | null;
  remarks: string | null;
  productName: string | null;
  productCost: number | null;
  advancePaid: number | null;
  balanceToBePaid: number | null;
  productCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersApiFilters {
  status: string | null;
  fulfillmentMethod: string | null;
  courier: string | null;
}

export interface OrdersApiSorting {
  sortBy: OrderSortField;
  sortOrder: SortOrder;
}

export interface OrdersApiResponse {
  correlationId: string;
  success: boolean;
  page: number;
  pageSize: number;
  query: string | null;
  filters: OrdersApiFilters;
  sorting: OrdersApiSorting;
  totalRecords: number;
  totalPages: number;
  orders: OrderResponse[];
}

export interface OrdersQueryState {
  q: string;
  status: string;
  fulfillmentMethod: string;
  courier: string;
  sortBy: OrderSortField;
  sortOrder: SortOrder;
}
