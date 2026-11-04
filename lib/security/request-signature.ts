import { createHmac, timingSafeEqual } from "node:crypto";
export function validSignature(value: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(value).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
