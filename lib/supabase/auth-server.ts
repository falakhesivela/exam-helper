import { redirect } from "next/navigation"
import { resolveAuthUser } from "@/lib/supabase/resolve-user"

function useMocks() {
  return (
    process.env.NEXT_PUBLIC_USE_MOCKS === "true" ||
    (!process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NODE_ENV === "development")
  )
}

/** Returns the authenticated user id, or null if signed out. */
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (useMocks()) return "mock-user"

  try {
    const user = await resolveAuthUser()
    return user?.id ?? null
  } catch {
    return null
  }
}

/** Redirects to /login when there is no valid session. */
export async function requireAuthUser(): Promise<string> {
  const userId = await getAuthenticatedUserId()
  if (!userId) redirect("/login")
  return userId
}
