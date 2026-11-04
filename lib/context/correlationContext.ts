import { AsyncLocalStorage } from "async_hooks";

interface CorrelationContext {
  correlationId: string;
}

const asyncLocalStorage =
  new AsyncLocalStorage<CorrelationContext>();

export function runWithCorrelationId<T>(
  correlationId: string,
  callback: () => T
): T {
  return asyncLocalStorage.run(
    { correlationId },
    callback
  );
}

export function getCorrelationId() {
  return (
    asyncLocalStorage.getStore()?.correlationId ??
    "N/A"
  );
}
