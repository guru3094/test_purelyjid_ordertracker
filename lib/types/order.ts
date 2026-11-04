export type ProductCategory = "Workshop" | "Resin Art" | "Raw Materials";

export interface Order {

    orderId: string;

    customerName: string;

    mobileNumber: string;

    email?: string;

    orderDate: string;

    fulfillmentMethod: "Pickup" | "Delivery";

    status: string;

    courierPartner?: string;

    trackingNumber?: string;

    expectedDeliveryDate?: string;

    remarks?: string;

    productName?: string;

    productCost?: number;

    advancePaid?: number;

    balanceToBePaid?: number;

    productCategory?: ProductCategory;

    lastUpdated: string;

}
