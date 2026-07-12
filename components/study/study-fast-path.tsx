"use client"

import { useMemo, type ReactNode } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Brain, PlayCircle, Sparkles, type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useDueReviewCount } from "@/components/dashboard/use-due-reviews"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

interface FastPathRow {
  key: string
  href: string
  icon: LucideIcon
  title: string
  subtitle: ReactNode
  cta: string
  badge?: number
  highlight?: boolean
}

/**
 * The three things a returning learner most likely came to do. Always above the
 * fold and one tap — the syllabus below is for deciding, this is for doing.
 */
export function StudyFastPath() {
  const sessions = useSessionStore((s) => s.sessions)
  const dueCount = useDueReviewCount()

  const inProgress = useMemo(
    () =>
      sessions
        .filter((s) => s.status === "in-progress" && s.mode !== "exam")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0] ?? null,
    [sessions],
  )

  const rows: FastPathRow[] = []

  if (inProgress) {
    const total = Math.max(
      inProgress.expectedQuestionCount ?? 0,
      inProgress.questions.length,
    )
    rows.push({
      key: "continue",
      href: `/quiz/${inProgress.id}`,
      icon: PlayCircle,
      title: "Continue where you left off",
      subtitle: `${inProgress.examCode} · question ${Math.min(
        inProgress.currentIndex + 1,
        total,
      )} of ${total}`,
      cta: "Continue",
      highlight: true,
    })
  }

  if (dueCount != null && dueCount > 0) {
    rows.push({
      key: "due",
      href: "/study/review?due=true",
      icon: Brain,
      title: "Reviews due today",
      subtitle: "Spaced repetition across your misses and key facts",
      cta: "Review",
      badge: dueCount,
      highlight: !inProgress,
    })
  }

  rows.push({
    key: "start",
    href: "/intake",
    icon: Sparkles,
    title: "Start a session",
    subtitle: "AI-generated questions tailored to your exam",
    cta: "New",
    highlight: rows.length === 0,
  })

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => {
        const Icon = row.icon
        return (
          <motion.div
            key={row.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={cn(
                "transition-colors hover:bg-muted/40",
                row.highlight &&
                  "border-primary/30 bg-linear-to-br from-primary/10 via-card to-card",
              )}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    row.highlight
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {row.title}
                    {row.badge != null && (
                      <Badge className="tabular-nums">{row.badge}</Badge>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {row.subtitle}
                  </p>
                </div>
                <Button asChild size="sm" variant={row.highlight ? "default" : "secondary"}>
                  <Link href={row.href}>
                    {row.cta}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
