import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabasePublishableKey, getSupabaseUrl } from "./env"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value),
            )
          }
        },
      },
    },
  )

  // Validates JWT signature and refreshes session if needed
  const { data: claimsData } = await supabase.auth.getClaims()

  // Freemium: visitors without a session get a silent anonymous account so the
  // per-user freemium/usage logic works without forcing a login. The account is
  // converted to a permanent one on sign-up (progress preserved). Only mint on
  // page navigations — never for API calls or external webhooks, which would
  // otherwise create throwaway anonymous users.
  const isApi = request.nextUrl.pathname.startsWith("/api")
  if (!isApi && !claimsData?.claims?.sub) {
    await supabase.auth.signInAnonymously()
  }

  return supabaseResponse
}
