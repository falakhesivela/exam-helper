"use client"

import { useRouter } from "next/navigation"
import { Check, ChevronDown, GraduationCap, Settings2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Compact exam scope switcher. View-only: switching re-fetches Learn, plan,
 * and readiness for the chosen exam without persisting anything — the app
 * follows the last-practiced exam again on next load.
 */
export function ExamSwitcher() {
  const router = useRouter()
  const userExams = useSessionStore((s) => s.userExams)
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const setActiveExam = useSessionStore((s) => s.setActiveExam)

  // The switcher only earns its space when there is something to switch.
  if (userExams.length < 2) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40"
        aria-label="Switch exam"
      >
        <GraduationCap className="size-3.5 text-primary" />
        {activeExamCode ?? "Exam"}
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Studying for</DropdownMenuLabel>
        {userExams.map((e) => (
          <DropdownMenuItem
            key={e.examCode}
            onClick={() => void setActiveExam(e.examCode)}
            className="flex items-start gap-2"
          >
            <span className="mt-0.5 size-4 shrink-0">
              {e.examCode === activeExamCode && (
                <Check className="size-4 text-primary" />
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium">{e.examCode}</span>
              <span className="truncate text-xs text-muted-foreground">
                {e.exam}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2"
        >
          <Settings2 className="size-4" />
          Manage exams
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
