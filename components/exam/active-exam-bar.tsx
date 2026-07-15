"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, GraduationCap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ActiveExam } from "@/hooks/use-active-exam"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { UserExam } from "@/types"

/**
 * Says which exam the page is about to launch, and is the only way to change it
 * from a launch flow. Switching here is the same view-only switch as the header
 * one: it rescopes the app without rewriting what the user is studying.
 */
export function ActiveExamBar({
  activeExam,
  userExams,
}: {
  activeExam: ActiveExam
  userExams: UserExam[]
}) {
  const router = useRouter()
  const setActiveExam = useSessionStore((s) => s.setActiveExam)
  const { blueprint } = activeExam

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <GraduationCap className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {activeExam.exam}
          {blueprint && (
            <span className="text-muted-foreground">
              {" "}
              · {activeExam.examCode}
            </span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {blueprint
            ? `Pass ${blueprint.passMark}% · ${blueprint.domains.length} domains · questions are weighted to the real blueprint`
            : "Custom exam · questions follow your syllabus and topics"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-primary/40"
          aria-label="Change exam"
        >
          Change
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Studying for</DropdownMenuLabel>
            {userExams.map((e) => (
              <DropdownMenuItem
                key={e.examCode}
                onClick={() => void setActiveExam(e.examCode)}
                className="flex items-start gap-2"
              >
                <span className="mt-0.5 size-4 shrink-0">
                  {e.examCode === activeExam.examCode && (
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
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2"
          >
            <Plus className="size-4" />
            Add or manage exams
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/**
 * Shown only when onboarding was skipped and there is no practice history to
 * infer from — the one case where a launch page legitimately has to ask.
 */
export function NoActiveExam({ action }: { action: string }) {
  return (
    <Empty className="rounded-xl border border-dashed border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GraduationCap />
        </EmptyMedia>
        <EmptyTitle>Which exam are you preparing for?</EmptyTitle>
        <EmptyDescription>
          Pick your certification once and we&apos;ll use it everywhere — {action}{" "}
          without asking again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/profile">Choose your exam</Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
