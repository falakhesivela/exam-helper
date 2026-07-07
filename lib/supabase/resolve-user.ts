import { headers } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env"
import { createClient } from "@/lib/supabase/server"

export interface ResolvedAuthUser {
  id: string
  email?: string
  /** True for Supabase anonymous sessions (no real account yet). */
  isAnonymous: boolean
}

/**
 * Resolve the signed-in user on the server.
 * Tries getClaims() first, then getUser() — avoids redirect loops when
 * claims verification is unavailable (e.g. right after password login).
 */
async function resolveUserFromBearer(
  token: string,
): Promise<ResolvedAuthUser | null> {
  const supabase = createSupabaseClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return {
    id: user.id,
    email: user.email ?? undefined,
    isAnonymous: user.is_anonymous ?? false,
  }
}

export async function resolveAuthUser(): Promise<ResolvedAuthUser | null> {
  const headerStore = await headers()
  const auth = headerStore.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    const fromBearer = await resolveUserFromBearer(auth.slice(7).trim())
    if (fromBearer) return fromBearer
  }

  const supabase = await createClient()

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  if (!claimsError && claimsData?.claims?.sub) {
    const claims = claimsData.claims as { sub: string; email?: unknown; is_anonymous?: unknown }
    return {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      isAnonymous: claims.is_anonymous === true,
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!userError && user) {
    return {
      id: user.id,
      email: user.email ?? undefined,
      isAnonymous: user.is_anonymous ?? false,
    }
  }

  return null
}
