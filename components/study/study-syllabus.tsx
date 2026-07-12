"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TopicCard } from "@/components/study/topic-card"
import type { LearnTopic } from "@/types"
import { cn } from "@/lib/utils"

type Lens = "recommended" | "in-progress" | "bookmarked" | "completed" | "all"

const LENSES: { value: Lens; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "in-progress", label: "In progress" },
  { value: "bookmarked", label: "Bookmarked" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All topics" },
]

const EMPTY_LENS_MESSAGES: Partial<Record<Lens, string>> = {
  "in-progress": "No lessons in progress. Open a topic to get started.",
  bookmarked: "No bookmarked lessons yet. Bookmark a lesson to find it here.",
  completed: "No completed lessons yet.",
  recommended: "You're all caught up — every topic is completed.",
}

function parseWeight(weight?: string): number {
  const n = Number.parseFloat(weight?.replace("%", "") ?? "")
  return Number.isNaN(n) ? -1 : n
}

/** The syllabus spine: every topic in the exam, filtered by lens. */
export function StudySyllabus({ topics }: { topics: LearnTopic[] }) {
  const [lens, setLens] = useState<Lens>("recommended")

  const filtered = useMemo(() => {
    switch (lens) {
      case "in-progress":
        return topics.filter((t) => t.lessonStatus === "started")
      case "bookmarked":
        return topics.filter((t) => t.bookmarked)
      case "completed":
        return topics.filter((t) => t.lessonStatus === "completed")
      case "recommended":
        // Backend order is already priority (weak topics in heavy domains
        // first, then unexplored topics); skip what's already completed.
        return topics.filter((t) => t.lessonStatus !== "completed")
      default:
        return topics
    }
  }, [topics, lens])

  /** Domain sections for the "All topics" lens, heaviest first. */
  const domainSections = useMemo(() => {
    const map = new Map<string, LearnTopic[]>()
    for (const t of topics) {
      const key = t.domainName ?? ""
      map.set(key, [...(map.get(key) ?? []), t])
    }
    return [...map.entries()].sort(
      (a, b) =>
        parseWeight(b[1][0]?.domainWeight) - parseWeight(a[1][0]?.domainWeight),
    )
  }, [topics])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter topics">
        {LENSES.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => setLens(l.value)}
            aria-pressed={lens === l.value}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              lens === l.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Keyed on the lens so switching cross-fades the list as a whole; the
          cards themselves are not staggered — 40 of them would be a slog. */}
      <motion.div
        key={lens}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {lens === "all" ? (
          <div className="flex flex-col gap-6">
            {domainSections.map(([domainName, domainTopics]) => (
              <section key={domainName || "other"} className="flex flex-col gap-3">
                {domainName && (
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold">{domainName}</h2>
                    {domainTopics[0]?.domainWeight && (
                      <Badge variant="outline" className="text-xs">
                        {domainTopics[0].domainWeight} of exam
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {domainTopics.filter((t) => t.lessonStatus !== "not-started").length}
                      /{domainTopics.length} studied
                    </span>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {domainTopics.map((t) => (
                    <TopicCard key={t.slug} topic={t} showDomain={false} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {EMPTY_LENS_MESSAGES[lens] ?? "Nothing here yet."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((t) => (
              <TopicCard key={t.slug} topic={t} showDomain />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
