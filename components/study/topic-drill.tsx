"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { buildTopicDrillParams } from "@/lib/study/topic-drill"
import { cn } from "@/lib/utils"

const COUNTS = [5, 10, 20]
const DIFFICULTIES = [
  { value: "easier", label: "Easier" },
  { value: "balanced", label: "Balanced" },
  { value: "harder", label: "Harder" },
] as const

type Difficulty = (typeof DIFFICULTIES)[number]["value"]

/** Generate a practice session scoped to this topic alone. */
export function TopicDrill({ topicSlug }: { topicSlug: string }) {
  const router = useRouter()
  const topic = useSessionStore((s) =>
    s.learnTopics.find((t) => t.slug === topicSlug),
  )
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const startPracticeGeneration = useGenerationStore(
    (s) => s.startPracticeGeneration,
  )

  const [count, setCount] = useState(10)
  const [difficulty, setDifficulty] = useState<Difficulty>("balanced")
  const [starting, setStarting] = useState(false)

  const examCode = activeExamCode ?? ""

  function start() {
    if (!topic || !examCode) return
    setStarting(true)
    startPracticeGeneration(
      buildTopicDrillParams({
        topicSlug,
        topicName: topic.topic,
        examCode,
        count,
        difficulty,
      }),
      {
        onReady: (session) => router.push(`/quiz/${session.id}`),
        onError: () => setStarting(false),
      },
    )
  }

  if (!topic) return null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Target className="size-5" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="font-medium">Drill this topic</p>
              <p className="text-sm text-muted-foreground text-pretty">
                Exam-style questions on {topic.topic} only — not the rest of the
                domain.
              </p>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Questions</legend>
            <div className="flex gap-2">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  aria-pressed={count === n}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors",
                    count === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Difficulty</legend>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  aria-pressed={difficulty === d.value}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    difficulty === d.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <Button size="lg" onClick={start} disabled={starting || !examCode}>
            {starting ? (
              <Spinner className="size-4" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            {starting ? "Generating…" : `Generate ${count} questions`}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
