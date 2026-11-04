import { google } from "googleapis";
import { config } from "@/lib/config";

export function getGoogleAuth() {
  if (!config.google.clientEmail) {
    throw new Error("GOOGLE_CLIENT_EMAIL is not configured.");
  }

  if (!config.google.privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is not configured.");
  }

  return new google.auth.JWT({
    email: config.google.clientEmail,
    key: config.google.privateKey,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
}
