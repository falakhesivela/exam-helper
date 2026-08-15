import type { Metadata } from "next"
import type { ReactNode } from "react"
import { requireAuthUser } from "@/lib/supabase/auth-server"
import { TopBar } from "@/components/layout/top-bar"
import { BackBar } from "@/components/layout/back-bar"
import { BottomNav } from "@/components/layout/bottom-nav"
import { GenerationTracker } from "@/components/generation/generation-tracker"
import { BadgeUnlockListener } from "@/components/gamification/badge-unlock-listener"

// Authenticated surfaces carry no public content — keep them out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Shared shell for authenticated app surfaces. Redirects to /login when signed out.
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireAuthUser()

  return (
    <div className="min-h-dvh">
      <GenerationTracker />
      <BadgeUnlockListener />
      <TopBar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 xl:pb-10">
        <BackBar />
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
