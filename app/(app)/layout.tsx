import type { ReactNode } from "react"
import { requireAuthUser } from "@/lib/supabase/auth-server"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { GenerationTracker } from "@/components/generation/generation-tracker"

// Shared shell for authenticated app surfaces. Redirects to /login when signed out.
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireAuthUser()

  return (
    <div className="min-h-dvh">
      <GenerationTracker />
      <TopBar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
