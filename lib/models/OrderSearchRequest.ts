export type SortOrder = "asc" | "desc";

export interface OrderSearchRequest {
  page: number;
  pageSize: number;

  q?: string;

  status?: string;
  fulfillmentMethod?: string;
  courier?: string;

  sortBy?: string;
  sortOrder?: SortOrder;
}
