export class CanvaApiError extends Error {
  constructor(status, providerCode, retryAfterSeconds = 0) {
    const quota = /quota|credit|trial/i.test(providerCode);
    const message = quota
      ? `Canva reports an exhausted Autofill quota (${providerCode}). Reconnecting will not reset this quota. Check the connected Canva account's plan and Autofill allowance.`
      : status === 429
      ? `Canva is temporarily limiting requests. Please wait ${retryAfterSeconds || 30} seconds before generating mats again.`
      : status === 401
      ? "Canva authorization has expired or was revoked. Connect Canva again."
      : status === 403
      ? "Canva denied access to the font template. Check the connected account's template permissions."
      : `Canva request failed (${status}${providerCode ? `: ${providerCode}` : ""}). Please try again later.`;
    super(message);
    this.name = "CanvaApiError";
    this.status = status;
    this.providerCode = providerCode;
    this.retryAfterSeconds = retryAfterSeconds;
    this.quotaExceeded = quota;
  }
}

export function retryAfterSeconds(value, now = Date.now()) {
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, Math.ceil((date - now) / 1000)) : 0;
}

/**
 * Retry only explicit throttling responses, never transport failures or quota
 * errors. A rejected 429 did not create a job; retrying a lost POST could.
 * @param {string} token
 * @param {string} endpoint
 * @param {unknown} [body]
 * @param {{fetchImpl?: typeof fetch, sleep?: (ms: number) => Promise<void>}} [options]
 */
export async function canvaRequest(token, endpoint, body, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const sleep = options.sleep || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetchImpl(`https://api.canva.com/rest/v1${endpoint}`, {
      method: body === undefined ? "GET" : "POST",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok) return data;
    const code = typeof data.code === "string" ? data.code : typeof data.error?.code === "string" ? data.error.code : "";
    const wait = retryAfterSeconds(response.headers.get("Retry-After")) || 2 ** (attempt + 1);
    const error = new CanvaApiError(response.status, code, response.status === 429 ? wait : 0);
    if (response.status !== 429 || error.quotaExceeded || attempt === 2 || wait > 10) throw error;
    await sleep(wait * 1000);
  }
  throw new Error("Canva request retries exhausted.");
}
