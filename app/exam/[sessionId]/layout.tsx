import type { ReactNode } from "react"
import { requireAuthUser } from "@/lib/supabase/auth-server"

export default async function ExamSessionLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAuthUser()
  return children
}
