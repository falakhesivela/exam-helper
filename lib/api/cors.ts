import type { NextRequest } from "next/server"

function allowedOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGIN?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (fromEnv?.length) return fromEnv
  const app = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return app ? [app] : []
}

/** CORS headers for cross-origin browser calls to /api (frontend on CF, API on Railway). */
export function corsHeadersForRequest(
  request: NextRequest | Request,
): Record<string, string> {
  const origins = allowedOrigins()
  if (origins.length === 0) return {}

  const origin = request.headers.get("Origin")
  if (!origin || !origins.includes(origin)) return {}

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Timezone, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  }
}
