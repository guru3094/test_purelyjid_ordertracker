import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const CANVA_API = "https://api.canva.com/rest/v1";
const CANVA_AUTHORIZE_URL = "https://www.canva.com/api/oauth/authorize";

const TOKEN_ROW_ID = "purelyjid-canva";

export const CANVA_SCOPES = [
  "design:content:read",
  "design:content:write",
  "design:meta:read",
] as const;

type CanvaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  scope?: string;
};

type StoredToken = {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  updated_at: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabaseAdmin() {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getOAuthConfig() {
  return {
    clientId: requireEnv("CANVA_CLIENT_ID"),
    clientSecret: requireEnv("CANVA_CLIENT_SECRET"),
    redirectUri: requireEnv("CANVA_REDIRECT_URI"),
  };
}

export function getCanvaRedirectUri(): URL {
  return new URL(getOAuthConfig().redirectUri);
}

function basicAuthorization() {
  const { clientId, clientSecret } = getOAuthConfig();

  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  )}`;
}

export function createPkcePair() {
  const codeVerifier = crypto.randomBytes(64).toString("base64url");

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return {
    codeVerifier,
    codeChallenge,
  };
}

export function createOAuthState() {
  return crypto.randomBytes(48).toString("base64url");
}

export function buildCanvaAuthorizationUrl(
  codeChallenge: string,
  state: string
) {
  const { clientId, redirectUri } = getOAuthConfig();

  const params = new URLSearchParams({
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: CANVA_SCOPES.join(" "),
    response_type: "code",
    client_id: clientId,
    state,
    redirect_uri: redirectUri,
  });

  return `${CANVA_AUTHORIZE_URL}?${params.toString()}`;
}

async function requestToken(
  params: URLSearchParams
): Promise<CanvaTokenResponse> {
  const response = await fetch(`${CANVA_API}/oauth/token`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: basicAuthorization(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Canva token request failed:", response.status, data);

    throw new Error(
      `Canva OAuth token request failed (${response.status}).`
    );
  }

  const token = data as Partial<CanvaTokenResponse>;

  if (
    !token.access_token ||
    !token.refresh_token ||
    typeof token.expires_in !== "number"
  ) {
    throw new Error("Canva returned an incomplete OAuth token response.");
  }

  return token as CanvaTokenResponse;
}

export async function exchangeAuthorizationCode(
  code: string,
  codeVerifier: string
) {
  const { redirectUri } = getOAuthConfig();

  return requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    })
  );
}

async function refreshAccessToken(refreshToken: string) {
  return requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    })
  );
}

export async function saveCanvaTokens(token: CanvaTokenResponse) {
  const supabase = getSupabaseAdmin();

  // Refresh slightly before Canva's actual expiry.
  const expiresAt = new Date(
    Date.now() + Math.max(token.expires_in - 120, 60) * 1000
  ).toISOString();

  const { error } = await supabase.from("canva_oauth_tokens").upsert(
    {
      id: TOKEN_ROW_ID,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    console.error("Unable to save Canva OAuth token:", error);
    throw new Error("Unable to store Canva OAuth credentials.");
  }
}

async function getStoredCanvaTokens(): Promise<StoredToken | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("canva_oauth_tokens")
    .select("*")
    .eq("id", TOKEN_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Unable to read Canva OAuth token:", error);
    throw new Error("Unable to read Canva OAuth credentials.");
  }

  return data as StoredToken | null;
}

let refreshInFlight: Promise<string> | null = null;

async function performRefresh(stored: StoredToken): Promise<string> {
  /*
   * Re-read immediately before refreshing.
   * Canva refresh tokens rotate, so we want the newest stored token.
   */
  const latest = await getStoredCanvaTokens();

  if (!latest) {
    throw new Error(
      "Canva is not connected. Authorize the PurelyJid Canva account first."
    );
  }

  // Another request may already have refreshed it.
  if (new Date(latest.expires_at).getTime() > Date.now() + 60_000) {
    return latest.access_token;
  }

  const token = await refreshAccessToken(latest.refresh_token);

  /*
   * IMPORTANT:
   * Canva returns a NEW refresh token.
   * saveCanvaTokens replaces the old one.
   */
  await saveCanvaTokens(token);

  return token.access_token;
}

export async function getValidCanvaAccessToken(): Promise<string> {
  const stored = await getStoredCanvaTokens();

  if (!stored) {
    throw new Error(
      "Canva is not connected. Visit /api/canva/connect to authorize Canva."
    );
  }

  const expiresAt = new Date(stored.expires_at).getTime();

  if (expiresAt > Date.now() + 60_000) {
    return stored.access_token;
  }

  if (!refreshInFlight) {
    refreshInFlight = performRefresh(stored).finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}
