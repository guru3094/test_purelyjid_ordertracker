import { NextResponse } from "next/server";
import { getStatusByCode } from "@/lib/supabase/statusRepository";

export async function GET() {
  try {
    const status = await getStatusByCode("SHIPPED");

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown Error",
      },
      {
        status: 500,
      }
    );
  }
}
