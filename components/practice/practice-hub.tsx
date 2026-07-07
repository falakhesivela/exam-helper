"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowRight,
  Bookmark,
  Brain,
  Layers,
  PlayCircle,
  RotateCcw,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PracticeMomentum } from "@/components/practice/practice-momentum"
import { useDueReviewCount } from "@/components/dashboard/use-due-reviews"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

interface ModeCard {
  key: string
  href: string
  icon: LucideIcon
  title: string
  description: string
  count: number | null
  accent: string
  highlight?: boolean
}

/** Unified Practice hub — entry point for all practice modes. */
export function PracticeHub() {
  const sessions = useSessionStore((s) => s.sessions)
  const dueCount = useDueReviewCount()
  const [missedCount, setMissedCount] = useState<number | null>(null)
  const [bookmarkCount, setBookmarkCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void api
      .missedQuestions(false)
      .then((res) => !cancelled && setMissedCount(res.count))
      .catch(() => !cancelled && setMissedCount(0))
    void api
      .bookmarks()
      .then((res) => !cancelled && setBookmarkCount(res.count))
      .catch(() => !cancelled && setBookmarkCount(0))
    return () => {
      cancelled = true
    }
  }, [])

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

  const modes: ModeCard[] = [
    {
      key: "due",
      href: "/practice/missed?due=true",
      icon: Brain,
      title: "Due reviews",
      description: "Spaced repetition queue for today",
      count: dueCount,
      accent: "text-violet-400 bg-violet-400/10 border-violet-400/30",
      highlight: dueCount != null && dueCount > 0,
    },
    {
      key: "missed",
      href: "/practice/missed",
      icon: RotateCcw,
      title: "Missed questions",
      description: "Retry questions you got wrong",
      count: missedCount,
      accent: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    },
    {
      key: "flashcards",
      href: "/practice/flashcards",
      icon: Layers,
      title: "Flashcards",
      description: "Quick recall from your misses",
      count: missedCount,
      accent: "text-sky-400 bg-sky-400/10 border-sky-400/30",
    },
    {
      key: "bookmarks",
      href: "/practice/bookmarks",
      icon: Bookmark,
      title: "Saved questions",
      description: "Questions you bookmarked",
      count: bookmarkCount,
      accent: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Build mastery with AI-generated questions tailored to your exam.
        </p>
      </div>

      <PracticeMomentum />

      <Button
        asChild
        size="lg"
        className="!h-12 w-full text-base sm:!h-control-lg sm:text-sm"
      >
        <Link href="/intake">
          <Sparkles data-icon="inline-start" />
          Start a session
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>

      {inProgress && (
        <Card className="border-primary/30 bg-linear-to-br from-primary/10 via-card to-card">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <PlayCircle className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Continue where you left off</p>
              <p className="truncate text-sm text-muted-foreground">
                {inProgress.examCode} · question{" "}
                {Math.min(
                  inProgress.currentIndex + 1,
                  Math.max(
                    inProgress.expectedQuestionCount ?? 0,
                    inProgress.questions.length,
                  ),
                )}
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/quiz/${inProgress.id}`}>Continue</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode, i) => {
          const Icon = mode.icon
          return (
            <motion.div
              key={mode.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={mode.href} className="block h-full">
                <Card
                  className={cn(
                    "h-full transition-colors hover:bg-muted/40",
                    mode.highlight && "border-primary/40 ring-1 ring-primary/20",
                  )}
                >
                  <CardContent className="flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl border",
                          mode.accent,
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      {mode.count != null && mode.count > 0 && (
                        <Badge
                          variant={mode.highlight ? "default" : "secondary"}
                          className="tabular-nums"
                        >
                          {mode.count}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{mode.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {mode.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
