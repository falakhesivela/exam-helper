"use client"

import { createClient } from "@/lib/supabase/client"
import { apiUrl, isExternalApi } from "./base-url"
import { ApiClientError } from "./error"

/** Backend routes that work without a session (sign-out is idempotent). */
function isPublicApiPath(path: string): boolean {
  return path.startsWith("/api/auth/")
}

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

/** Build fetch init for API calls — always attaches Bearer token for the FastAPI backend. */
export async function buildApiFetchInit(
  path: string,
  init?: RequestInit,
): Promise<{ url: string; init: RequestInit }> {
  const headers = new Headers(init?.headers)

  if (!headers.has("X-Timezone")) {
    headers.set("X-Timezone", getTimezone())
  }

  const body = init?.body
  if (
    !headers.has("Content-Type") &&
    body != null &&
    !(body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json")
  }

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`)
  } else if (!isPublicApiPath(path)) {
    // The backend authenticates by bearer token only — it never reads the
    // session cookie. Sending the request anyway would return a 401 that is
    // indistinguishable from a rejected token, so say so up front.
    throw new ApiClientError("Not authenticated", 401)
  }

  const external = isExternalApi()
  return {
    url: apiUrl(path),
    init: {
      ...init,
      headers,
      credentials: external ? "omit" : "same-origin",
    },
  }
}
