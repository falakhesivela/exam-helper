"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  Bookmark,
  Brain,
  Layers,
  RotateCcw,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useDueReviewCount } from "@/components/dashboard/use-due-reviews"
import { QuickStartCard } from "@/components/practice/quick-start-card"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface PracticeMode {
  key: string
  href: string
  icon: LucideIcon
  title: string
  description: string
  count: number | null
  accent: string
  highlight?: boolean
}

/**
 * One-tap access to every practice mode.
 */
export function StudyFastPath({
  showHeading = true,
  initialTopic,
}: {
  showHeading?: boolean
  initialTopic?: string
}) {
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

  const modes: PracticeMode[] = [
    {
      key: "due",
      href: "/practice/review?due=true",
      icon: Brain,
      title: "Due reviews",
      description: "Your spaced-repetition queue for today",
      count: dueCount,
      accent: "border-violet-400/30 bg-violet-400/10 text-violet-400",
      highlight: dueCount != null && dueCount > 0,
    },
    {
      key: "missed",
      href: "/practice/review?mode=quiz&source=questions",
      icon: RotateCcw,
      title: "Retry misses",
      description: "Answer questions you previously got wrong",
      count: missedCount,
      accent: "border-orange-400/30 bg-orange-400/10 text-orange-400",
    },
    {
      key: "flashcards",
      href: "/practice/review?source=questions",
      icon: Layers,
      title: "Flashcards",
      description: "Quick recall cards built from your misses",
      count: missedCount,
      accent: "border-sky-400/30 bg-sky-400/10 text-sky-400",
    },
    {
      key: "saved",
      href: "/practice/saved",
      icon: Bookmark,
      title: "Saved questions",
      description: "Revisit or quiz yourself on bookmarks",
      count: bookmarkCount,
      accent: "border-amber-400/30 bg-amber-400/10 text-amber-400",
    },
  ]

  return (
    <section
      aria-labelledby={showHeading ? "practice-heading" : undefined}
      className="flex flex-col gap-4"
    >
      {showHeading && (
        <div className="flex flex-col gap-1">
          <h2 id="practice-heading" className="text-lg font-semibold">
            Practice
          </h2>
          <p className="text-sm text-muted-foreground">
            Build exam confidence with a fresh session or a focused review.
          </p>
        </div>
      )}

      <QuickStartCard initialTopic={initialTopic} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    mode.highlight &&
                      "border-primary/40 ring-1 ring-primary/20",
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl border",
                          mode.accent,
                        )}
                      >
                        <Icon className="size-4.5" />
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
                      <p className="text-sm font-medium">{mode.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
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
    </section>
  )
}
