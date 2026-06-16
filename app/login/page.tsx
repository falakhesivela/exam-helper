import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { getAuthenticatedUserId } from "@/lib/supabase/auth-server"

export default async function LoginPage() {
  const userId = await getAuthenticatedUserId()
  if (userId) redirect("/dashboard")

  return <AuthForm mode="login" />
}
