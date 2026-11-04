import { Order } from "@/lib/types/order";

export interface QueueItem {

    order: Order;

    retryCount: number;

    createdAt: Date;

}
