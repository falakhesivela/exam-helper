import type { ReactNode } from "react"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNav } from "@/components/layout/bottom-nav"

// Shared shell for the main authenticated app surfaces. The quiz experience
// intentionally lives outside this group so it can be fully distraction-free.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
