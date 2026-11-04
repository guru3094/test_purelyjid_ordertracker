import { NextResponse } from "next/server";

import { ApiError } from "@/lib/errors/ApiError";

import { logger } from "@/lib/logger/logger";

export async function handleApiRequest(
  callback: () => Promise<NextResponse>
) {
  try {
    return await callback();
  } catch (error) {
    logger.error(
      "api",
      "Unhandled API exception",
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }
    );

    if (error instanceof ApiError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: error.statusCode,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}
