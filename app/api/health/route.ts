import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/health/databaseHealth";
import { checkGoogleHealth } from "@/lib/health/googleHealth";

import { getQueueSize } from "@/lib/queue/writeQueue";

export async function GET() {
  const database = await checkDatabaseHealth();
  const google = await checkGoogleHealth();

  const queueSize = getQueueSize();

  const overallStatus =
    database === "UP" && google === "UP"
      ? "UP"
      : "DOWN";

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),

    services: {
      database,
      google,
      queue: "UP",
    },

    queueSize,
  });
}
