export const config = {
  appName: "PurelyJid Order Tracker",

  syncIntervalMinutes: Number(
    process.env.SYNC_INTERVAL_MINUTES ?? 5
  ),

  google: {
    projectId: process.env.GOOGLE_PROJECT_ID ?? "",

    clientEmail:
      process.env.GOOGLE_CLIENT_EMAIL ?? "",

    privateKey:
      process.env.GOOGLE_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n"
      ) ?? "",

    sheetId:
      process.env.GOOGLE_SHEET_ID ?? "",

    worksheetName: "Orders",
  },

  supabase: {
    url:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",

    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  },

  retry: {
    maxRetryCount: Number(
      process.env.MAX_RETRY_COUNT ?? 3
    ),
  },
};
