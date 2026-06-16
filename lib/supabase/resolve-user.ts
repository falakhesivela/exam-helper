import { createClient } from "@/lib/supabase/server"

export interface ResolvedAuthUser {
  id: string
  email?: string
}

/**
 * Resolve the signed-in user on the server.
 * Tries getClaims() first, then getUser() — avoids redirect loops when
 * claims verification is unavailable (e.g. right after password login).
 */
export async function resolveAuthUser(): Promise<ResolvedAuthUser | null> {
  const supabase = await createClient()

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims()

  if (!claimsError && claimsData?.claims?.sub) {
    return {
      id: claimsData.claims.sub,
      email:
        typeof claimsData.claims.email === "string"
          ? claimsData.claims.email
          : undefined,
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!userError && user) {
    return { id: user.id, email: user.email ?? undefined }
  }

  return null
}
