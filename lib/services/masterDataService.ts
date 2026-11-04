import { ApiError } from "@/lib/errors/ApiError";

import {
  getActiveCouriers,
  getActiveFulfillmentMethods,
  getActiveStatuses,
} from "@/lib/supabase/masterDataRepository";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

let statusesCache: CacheEntry<string[]> | null = null;
let couriersCache: CacheEntry<string[]> | null = null;
let fulfillmentMethodsCache: CacheEntry<string[]> | null = null;

function isCacheValid<T>(
  cacheEntry: CacheEntry<T> | null
): cacheEntry is CacheEntry<T> {
  return (
    cacheEntry !== null &&
    cacheEntry.expiresAt > Date.now()
  );
}

function findCanonicalValue(
  values: string[],
  requestedValue: string
): string | undefined {
  return values.find(
    (value) =>
      value.toLowerCase() === requestedValue.toLowerCase()
  );
}

export async function getValidStatuses(): Promise<string[]> {
  if (isCacheValid(statusesCache)) {
    return statusesCache.value;
  }

  const statuses = await getActiveStatuses();

  statusesCache = {
    value: statuses,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return statuses;
}

export async function getValidCouriers(): Promise<string[]> {
  if (isCacheValid(couriersCache)) {
    return couriersCache.value;
  }

  const couriers = await getActiveCouriers();

  couriersCache = {
    value: couriers,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return couriers;
}

export async function getValidFulfillmentMethods(): Promise<
  string[]
> {
  if (isCacheValid(fulfillmentMethodsCache)) {
    return fulfillmentMethodsCache.value;
  }

  const fulfillmentMethods =
    await getActiveFulfillmentMethods();

  fulfillmentMethodsCache = {
    value: fulfillmentMethods,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return fulfillmentMethods;
}

export async function validateStatus(
  status?: string
): Promise<string | undefined> {
  const requestedStatus = status?.trim();

  if (!requestedStatus) {
    return undefined;
  }

  const validStatuses = await getValidStatuses();

  const canonicalStatus = findCanonicalValue(
    validStatuses,
    requestedStatus
  );

  if (!canonicalStatus) {
    throw new ApiError(
      `Invalid status filter. Allowed values: ${validStatuses.join(
        ", "
      )}`,
      400
    );
  }

  return canonicalStatus;
}

export async function validateCourier(
  courier?: string
): Promise<string | undefined> {
  const requestedCourier = courier?.trim();

  if (!requestedCourier) {
    return undefined;
  }

  const validCouriers = await getValidCouriers();

  const canonicalCourier = findCanonicalValue(
    validCouriers,
    requestedCourier
  );

  if (!canonicalCourier) {
    throw new ApiError(
      `Invalid courier filter. Allowed values: ${validCouriers.join(
        ", "
      )}`,
      400
    );
  }

  return canonicalCourier;
}

export async function validateFulfillmentMethod(
  fulfillmentMethod?: string
): Promise<string | undefined> {
  const requestedFulfillmentMethod =
    fulfillmentMethod?.trim();

  if (!requestedFulfillmentMethod) {
    return undefined;
  }

  const validFulfillmentMethods =
    await getValidFulfillmentMethods();

  const canonicalFulfillmentMethod = findCanonicalValue(
    validFulfillmentMethods,
    requestedFulfillmentMethod
  );

  if (!canonicalFulfillmentMethod) {
    throw new ApiError(
      `Invalid fulfillmentMethod filter. Allowed values: ${validFulfillmentMethods.join(
        ", "
      )}`,
      400
    );
  }

  return canonicalFulfillmentMethod;
}

export function clearMasterDataCache(): void {
  statusesCache = null;
  couriersCache = null;
  fulfillmentMethodsCache = null;
}
