import { NextRequest, NextResponse } from "next/server";
import {
  exchangeAuthorizationCode,
  saveCanvaTokens,
} from "@/lib/canva/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const expectedState = request.cookies.get("canva_oauth_state")?.value;
  const codeVerifier = request.cookies.get(
    "canva_oauth_verifier"
  )?.value;

  if (oauthError) {
    return NextResponse.json(
      {
        error: `Canva authorization failed: ${oauthError}`,
      },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      {
        error: "Canva did not return an authorization code.",
      },
      { status: 400 }
    );
  }

  if (
    !returnedState ||
    !expectedState ||
    returnedState !== expectedState
  ) {
    return NextResponse.json(
      {
        error:
          "Canva OAuth state validation failed. Please start the connection again.",
      },
      { status: 400 }
    );
  }

  if (!codeVerifier) {
    return NextResponse.json(
      {
        error:
          "Canva OAuth verifier is missing or expired. Please start the connection again.",
      },
      { status: 400 }
    );
  }

  try {
    const token = await exchangeAuthorizationCode(
      code,
      codeVerifier
    );

    await saveCanvaTokens(token);

    const destination = request.cookies.get("canva_oauth_return")?.value === "/cricut_svg" ? "/cricut_svg" : "/vinylfonts";
    const redirectUrl = new URL(destination, request.url);

    redirectUrl.searchParams.set("canva", "connected");

    const response = NextResponse.redirect(redirectUrl);

    response.cookies.delete("canva_oauth_state");
    response.cookies.delete("canva_oauth_verifier");
    response.cookies.delete("canva_oauth_return");

    return response;
  } catch (error) {
    console.error("Canva OAuth callback failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to connect Canva.",
      },
      { status: 500 }
    );
  }
}
