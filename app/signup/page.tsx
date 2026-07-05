import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { getAuthenticatedUserId } from "@/lib/supabase/auth-server"

export const metadata: Metadata = {
  title: "Start free — AI practice questions for any certification exam",
  description:
    "Create a free Prepa account and get 20 AI-generated practice questions per day for AWS, Azure, CompTIA, PMP, CISSP and more — with instant explanations and progress tracking.",
  alternates: { canonical: "/signup" },
}

export default async function SignupPage() {
  const userId = await getAuthenticatedUserId()
  if (userId) redirect("/dashboard")

  return <AuthForm mode="signup" />
}
