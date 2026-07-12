import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MentorMobileThreads } from "@/components/mentor/mentor-workspace"
import { Button } from "@/components/ui/button"

/**
 * The parent Mentor workspace owns viewport sizing. Keeping this shell purely
 * flex-based avoids negative margins and makes the composer respond correctly
 * to mobile safe areas and the virtual keyboard.
 */
export function MentorChatShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3 sm:px-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/mentor">
            <ArrowLeft data-icon="inline-start" />
            Mentor home
          </Link>
        </Button>
        <MentorMobileThreads />
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">{children}</div>
    </div>
  )
}
