import type { ReactNode } from "react"
import Link from "next/link"
import { Bot, Plus } from "lucide-react"
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
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bot className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Mentor</p>
            <p className="truncate text-xs text-muted-foreground">
              Your exam study assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <MentorMobileThreads />
          <Button asChild variant="ghost" size="sm" className="xl:hidden">
            <Link href="/mentor">
              <Plus data-icon="inline-start" />
              <span className="hidden sm:inline">New chat</span>
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-3 sm:px-5 sm:pb-4">
        {children}
      </div>
    </div>
  )
}
