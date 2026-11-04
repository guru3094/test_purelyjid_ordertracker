export function validateCourier(
  fulfillmentMethod: string,
  courierPartner?: string
): void {
  if (
    fulfillmentMethod === "Pickup" &&
    courierPartner &&
    courierPartner.trim() !== ""
  ) {
    throw new Error(
      "Pickup orders must not have a courier partner."
    );
  }

  if (
    fulfillmentMethod === "Delivery" &&
    (!courierPartner || courierPartner.trim() === "")
  ) {
    throw new Error(
      "Delivery orders require a courier partner."
    );
  }
}
