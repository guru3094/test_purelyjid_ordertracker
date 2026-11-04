export const MAX_RETRY_COUNT = 3;

export function canRetry(
  retryCount: number
): boolean {
  return retryCount < MAX_RETRY_COUNT;
}

export function incrementRetryCount(
  retryCount: number
): number {
  return retryCount + 1;
}
