import { resolveAuthUser } from "@/lib/supabase/resolve-user"

export interface AuthUser {
  id: string
  email?: string
  isAnonymous: boolean
}

/** Verifies the session on the server — safe for API route protection. */
export async function requireUser(): Promise<AuthUser> {
  const user = await resolveAuthUser()
  if (!user) throw new Error("Unauthorized")
  return user
}
