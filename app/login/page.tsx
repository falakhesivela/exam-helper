import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { getAuthenticatedUserId } from "@/lib/supabase/auth-server"

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to Prepa to continue your certification exam prep — pick up your streak, review missed questions, and track your progress.",
  alternates: { canonical: "/login" },
}

export default async function LoginPage() {
  const userId = await getAuthenticatedUserId()
  if (userId) redirect("/dashboard")

  return <AuthForm mode="login" />
}
