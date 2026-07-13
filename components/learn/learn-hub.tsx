"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Lightbulb, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Progress } from "@/components/ui/progress"
import { ExamTipsCard } from "@/components/study/exam-tips-card"
import { StudySyllabus } from "@/components/study/study-syllabus"
import { isAssessed } from "@/components/study/topic-card"
import { useSessionStore } from "@/lib/store/use-session-store"

/** Focused home for syllabus coverage, lessons, labs, and topic drills. */
export function LearnHub() {
  const topics = useSessionStore((s) => s.learnTopics)
  const dataReady = useSessionStore((s) => s.dataReady)

  const studied = topics.filter((topic) => topic.lessonStatus !== "not-started").length
  const mastered = topics.filter(
    (topic) => isAssessed(topic) && topic.mastery >= 80,
  ).length

  return (
    <div className="flex flex-col gap-6">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Work through the syllabus with lessons, labs, and topic drills.
          </p>
        </div>
        {topics.some((topic) => topic.hasAiContent) && (
          <Button asChild variant="outline" size="sm">
            <Link href="/practice/review?source=facts">
              <Lightbulb data-icon="inline-start" />
              Key-fact cards
            </Link>
          </Button>
        )}
      </motion.header>

      {topics.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">
              {studied} of {topics.length} topics studied
            </span>
            {mastered > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {mastered} mastered
              </span>
            )}
          </div>
          <Progress value={(studied / topics.length) * 100} className="h-1.5" />
        </div>
      )}

      {topics.length === 0 && !dataReady ? (
        <div className="flex flex-col gap-3">
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
          <CardSkeleton rows={2} />
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Sparkles className="size-10 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <p className="font-medium">No topics yet</p>
              <p className="text-sm text-muted-foreground text-pretty">
                Start a quick practice session to unlock your personalized
                syllabus.
              </p>
            </div>
            <Button asChild>
              <Link href="/intake">Start practicing</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <StudySyllabus topics={topics} />
      )}

      <ExamTipsCard />
    </div>
  )
}
