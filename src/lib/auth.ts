import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db";

const originalFetch: typeof fetch = globalThis.fetch
globalThis.fetch = async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input instanceof Request
          ? input.url
          : undefined
  const method = init?.method ?? (input instanceof Request ? input.method : "GET")
  const hasBody = Boolean(init?.body ?? (input instanceof Request ? input.body : undefined))
  const isGoogleOAuth = requestUrl?.includes("oauth2.googleapis.com/token")

  if (isGoogleOAuth) {
    console.info("[fetch] google request", { url: requestUrl, method, hasBody })
  }

  try {
    const response = await originalFetch(input, init)
    if (isGoogleOAuth) {
      console.info("[fetch] google response status", response.status)
      try {
        const clone = response.clone()
        const bodyText = await clone.text()
        console.info("[fetch] google response body", bodyText.slice(0, 400))
      } catch (error) {
        console.warn("[fetch] google response body read failed", error)
      }
    }
    return response
  } catch (error) {
    if (isGoogleOAuth) {
      console.error("[fetch] google request failed", error)
    }
    throw error
  }
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const betterAuthUrl = process.env.BETTER_AUTH_URL ?? appUrl;
const devOrigins = process.env.NODE_ENV !== "production" ? ["http://localhost:3001", "http://192.168.100.11:3000"] : [];
const trustedOrigins = Array.from(
  new Set(
    [betterAuthUrl, appUrl, ...devOrigins]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
  )
);

console.info("[auth] baseURL", betterAuthUrl);
console.info("[auth] trustedOrigins", trustedOrigins);
console.info("[auth] google clientId", process.env.GOOGLE_CLIENT_ID);
console.info("[auth] google secret present", Boolean(process.env.GOOGLE_CLIENT_SECRET));

export const auth = betterAuth({
  baseURL: betterAuthUrl,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
