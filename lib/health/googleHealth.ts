import { readOrdersSheet } from "@/lib/google/sheets";

export async function checkGoogleHealth() {
  try {
    await readOrdersSheet();
    return "UP";
  } catch {
    return "DOWN";
  }
}
