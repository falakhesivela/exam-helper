import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { getAuthenticatedUserId } from "@/lib/supabase/auth-server"

export const metadata: Metadata = {
  title: "Start free — verified practice questions for any certification exam",
  description:
    "Create a free Prepa account and get 30 practice questions for AWS, Azure, CompTIA, Cisco, CISSP and more — every multiple-choice answer key blind-checked by a second model, every explanation linked to the vendor's own docs.",
  alternates: { canonical: "/signup" },
}

export default async function SignupPage() {
  const userId = await getAuthenticatedUserId()
  if (userId) redirect("/dashboard")

  return <AuthForm mode="signup" />
}
