export function isEmpty(
    value?: string
): boolean {

    return !value || value.trim().length === 0;

}

export function isPickup(
    method: string
): boolean {

    return method === "Pickup";

}

export function isDelivery(
    method: string
): boolean {

    return method === "Delivery";

}
