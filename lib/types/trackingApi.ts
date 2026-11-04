import { OrderResponse } from "@/lib/types/orderApi";

export interface TrackOrderApiResponse {
  correlationId: string;
  success: boolean;
  order: OrderResponse | null;
}
