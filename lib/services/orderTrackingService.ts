import { readOrdersSheet } from '@/lib/google/sheets';
import { ApiError } from "@/lib/errors/ApiError";
import { mapOrderResponse } from "@/lib/mappers/orderResponseMapper";
import { findOrderForCustomer } from "@/lib/supabase/ordersRepository";

const MIN_ORDER_ID_LENGTH = 3;
const MAX_ORDER_ID_LENGTH = 100;

const MIN_MOBILE_LENGTH = 8;
const MAX_MOBILE_LENGTH = 15;

function normalizeMobileNumber(
  mobileNumber: string
): string {
  return mobileNumber.replace(/\D/g, "");
}

export async function trackCustomerOrder(
  orderId: string,
  mobileNumber: string
) {
  const normalizedOrderId = orderId.trim();

  const normalizedMobileNumber =
    normalizeMobileNumber(mobileNumber);

  if (!normalizedOrderId) {
    throw new ApiError(
      "Order ID is required",
      400
    );
  }

  if (
    normalizedOrderId.length < MIN_ORDER_ID_LENGTH ||
    normalizedOrderId.length > MAX_ORDER_ID_LENGTH
  ) {
    throw new ApiError(
      "Please enter a valid Order ID",
      400
    );
  }

  if (!normalizedMobileNumber) {
    throw new ApiError(
      "Mobile number is required",
      400
    );
  }

  if (
    normalizedMobileNumber.length < MIN_MOBILE_LENGTH ||
    normalizedMobileNumber.length > MAX_MOBILE_LENGTH
  ) {
    throw new ApiError(
      "Please enter a valid mobile number",
      400
    );
  }

  const order = await findOrderForCustomer(
    normalizedOrderId,
    normalizedMobileNumber
  );

  if (!order) {
    // Store orders retain PJM references and are available before the scheduled Sheet → DB sync.
    if (/^PJM\d{6,15}$/.test(normalizedOrderId)) {
      const rows = await readOrdersSheet();
      const matches = rows.slice(1).filter(r => r[0] === normalizedOrderId && String(r[2] || '').replace(/\D/g, '') === normalizedMobileNumber);
      if (matches.length === 1) {
        const r=matches[0];
        return {success:true,order:{orderId:r[0],customerName:r[1],mobileNumber:r[2],email:r[3]||null,orderDate:r[4]||null,fulfillmentMethod:r[5],status:r[6]||null,courier:r[7]||null,trackingNumber:r[8]||null,expectedDeliveryDate:r[9]||null,remarks:r[10]||null,productName:r[14]||null,productCost:Number(r[15])||0,advancePaid:Number(r[16])||0,balanceToBePaid:Number(r[17])||0,productCategory:r[18]||null,createdAt:'',updatedAt:r[11]||''}};
      }
    }
    throw new ApiError(
      "We could not find an order matching the provided details.",
      404
    );
  }

  return {
    success: true,
    order: mapOrderResponse(order),
  };
}
