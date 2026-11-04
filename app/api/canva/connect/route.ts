import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildCanvaAuthorizationUrl,
  createOAuthState,
  createPkcePair,
  getCanvaRedirectUri,
} from "@/lib/canva/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // OAuth cookies are scoped to a hostname. Start authorization on the
    // configured callback host (localhost and 127.0.0.1 are distinct hosts).
    const callbackOrigin = getCanvaRedirectUri().origin;
    if (request.nextUrl.origin !== callbackOrigin) {
      return NextResponse.redirect(new URL(`/api/canva/connect${request.nextUrl.search}`, callbackOrigin));
    }

    const { codeVerifier, codeChallenge } = createPkcePair();
    const state = createOAuthState();

    const authorizationUrl = buildCanvaAuthorizationUrl(
      codeChallenge,
      state
    );

    const response = NextResponse.redirect(authorizationUrl);

    const secure = process.env.NODE_ENV === "production";

    response.cookies.set("canva_oauth_verifier", codeVerifier, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    response.cookies.set("canva_oauth_state", state, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    response.cookies.set("canva_oauth_return", request.nextUrl.searchParams.get("next") === "/cricut_svg" ? "/cricut_svg" : "/vinylfonts", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60,
    });

    return response;
  } catch (error) {
    console.error("Unable to start Canva OAuth:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start Canva authorization.",
      },
      { status: 500 }
    );
  }
}
