"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { MessagesSquare } from "lucide-react"
import { MentorThreadList } from "@/components/mentor/mentor-thread-list"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MentorWorkspace({ children }: { children: ReactNode }) {
  return (
    <div className="h-[calc(100dvh-10rem-env(safe-area-inset-bottom))] min-h-[30rem] overflow-hidden rounded-2xl border bg-background xl:h-[calc(100dvh-8rem)] xl:max-h-[56rem]">
      <div className="grid h-full min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside
          className="hidden min-h-0 min-w-0 overflow-hidden border-r bg-card/35 xl:flex"
          aria-label="Mentor conversations"
        >
          <MentorThreadList variant="sidebar" />
        </aside>
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {children}
        </section>
      </div>
    </div>
  )
}

export function MentorMobileThreads() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground xl:hidden">
        <MessagesSquare className="size-4" />
        Chats
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(22rem,88vw)] gap-0 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Mentor conversations</SheetTitle>
        </SheetHeader>
        <MentorThreadList
          variant="sidebar"
          onConversationSelect={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
