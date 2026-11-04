import { randomUUID } from "crypto";

export function generateCorrelationId() {
  return randomUUID();
}
