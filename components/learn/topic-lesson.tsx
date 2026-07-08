"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, ExternalLink, GraduationCap } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CuratedOutline } from "@/components/learn/curated-outline"
import { AiDeepDive } from "@/components/learn/ai-deep-dive"
import { CHECK_PASS_RATIO, LessonCheck } from "@/components/learn/lesson-check"
import { LessonTutor } from "@/components/learn/lesson-tutor"
import { LessonActions } from "@/components/learn/lesson-actions"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { TopicLesson } from "@/types"
import type { StreamingLessonContent } from "@/lib/ai/index"
import { ApiClientError } from "@/lib/api/client"

interface TopicLessonViewProps {
  topicSlug: string
}

/** Full lesson page combining curated outline and AI deep-dive. */
export function TopicLessonView({ topicSlug }: TopicLessonViewProps) {
  const learnTopics = useSessionStore((s) => s.learnTopics)
  const fetchLesson = useSessionStore((s) => s.fetchLesson)
  const generateLesson = useSessionStore((s) => s.generateLesson)
  const ensureLesson = useSessionStore((s) => s.ensureLesson)
  const updateLessonProgress = useSessionStore((s) => s.updateLessonProgress)
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)
  // Set when this lesson was opened from a study-plan task; completing the
  // lesson also completes that task.
  const planTaskId = useSearchParams().get("planTask")

  const [lesson, setLesson] = useState<TopicLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  /** Latest partial lesson snapshot while generation streams in. */
  const [streaming, setStreaming] = useState<StreamingLessonContent | null>(null)
  const [completing, setCompleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchLesson(topicSlug)
      setLesson(data)
      // Already-completed lesson: the plan task is fulfilled as-is.
      if (planTaskId && data.status === "completed") {
        void updatePlanTask(planTaskId, { status: "done" })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load lesson")
    } finally {
      setLoading(false)
    }
  }, [fetchLesson, topicSlug, planTaskId, updatePlanTask])

  useEffect(() => {
    load()
  }, [load])

  async function handleGenerate(force = false) {
    setGenerating(true)
    setStreaming(null)
    try {
      const data = await generateLesson(topicSlug, force, {
        onDelta: setStreaming,
      })
      setLesson(data)
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "LESSON_LIMIT") {
        toast.error("AI lesson limit reached on your plan. Cached lessons are still available.")
      } else {
        toast.error(err instanceof Error ? err.message : "Could not generate lesson")
      }
    } finally {
      setGenerating(false)
      setStreaming(null)
    }
  }

  async function handleMarkComplete() {
    setCompleting(true)
    try {
      let current = lesson
      if (!current?.id) {
        current = await ensureLesson(topicSlug)
        setLesson(current)
      }
      if (!current?.id) return

      await updateLessonProgress(current.id, { status: "completed" })
      setLesson((prev) => (prev ? { ...prev, status: "completed", id: current!.id } : prev))
      if (planTaskId) void updatePlanTask(planTaskId, { status: "done" })
      toast.success("Lesson marked complete")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update progress")
    } finally {
      setCompleting(false)
    }
  }

  async function handleCheckSubmit(score: number, total: number) {
    setCompleting(true)
    try {
      let current = lesson
      if (!current?.id) {
        current = await ensureLesson(topicSlug)
        setLesson(current)
      }
      if (!current?.id) return

      await updateLessonProgress(current.id, {
        checkScore: score,
        checkTotal: total,
      })
      const passed = score >= total * CHECK_PASS_RATIO
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              id: current!.id,
              checkScore: score,
              checkTotal: total,
              status: passed ? "completed" : prev.status,
            }
          : prev,
      )
      if (passed) {
        if (planTaskId) void updatePlanTask(planTaskId, { status: "done" })
        toast.success("Check passed — lesson complete!")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your result")
    } finally {
      setCompleting(false)
    }
  }

  async function handleToggleBookmark() {
    setCompleting(true)
    try {
      let current = lesson
      if (!current?.id) {
        current = await ensureLesson(topicSlug)
        setLesson(current)
      }
      if (!current?.id) return

      const next = !current.bookmarked
      await updateLessonProgress(current.id, { bookmarked: next })
      setLesson((prev) => (prev ? { ...prev, bookmarked: next, id: current!.id } : prev))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update bookmark")
    } finally {
      setCompleting(false)
    }
  }

  if (loading || !lesson) {
    return <LoadingScreen message="Loading lesson…" className="min-h-[50vh]" />
  }

  // null = unlimited on the user's tier.
  const remainingLessons =
    lesson.dailyLessonLimit === null
      ? Infinity
      : Math.max(
          0,
          (lesson.dailyLessonLimit ?? 3) - (lesson.lessonsUsedToday ?? 0),
        )

  const limitMessage =
    lesson.dailyLessonLimit != null
      ? `${remainingLessons} of ${lesson.dailyLessonLimit} AI lessons remaining`
      : undefined

  // ~200 wpm over the actual lesson text, not a guess from bullet count.
  const wordSources: string[] = [...lesson.outline]
  if (lesson.content) {
    const c = lesson.content
    wordSources.push(
      ...c.deepDive.flatMap((s) => [s.title, s.body]),
      ...(c.comparisons ?? []).flatMap((t) => [t.title, ...t.columns, ...t.rows.flat()]),
      ...c.commonTraps,
      ...(c.keyFacts ?? []).map((f) => f.fact),
      c.recap,
    )
  }
  const wordCount = wordSources.join(" ").split(/\s+/).filter(Boolean).length
  const readMinutes = Math.max(2, Math.round(wordCount / 200))

  // Next recommended topic: learnTopics is already in priority order.
  const nextTopic = learnTopics.find(
    (t) => t.slug !== topicSlug && t.lessonStatus !== "completed",
  )

  const providerNoun =
    {
      aws: "AWS service or pattern",
      azure: "Azure service",
      gcp: "Google Cloud service",
    }[lesson.provider ?? ""] ?? "approach or technology"
  const hasWeight = lesson.domainWeight && lesson.domainWeight !== "—"

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        href="/learn"
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Learning
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lesson.examCode}</Badge>
          <Badge variant="outline">{lesson.domainName}</Badge>
          {hasWeight && (
            <span className="text-xs text-muted-foreground">
              {lesson.domainWeight} of exam
            </span>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {lesson.topicName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="size-4" />
            {lesson.questionsAnswered > 0
              ? `${lesson.mastery}% mastery`
              : "Not practiced yet"}
          </span>
          <span>~{readMinutes} min read</span>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exam context</CardTitle>
          <CardDescription>{lesson.exam}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-foreground/90">
          This topic falls under <strong>{lesson.domainName}</strong>
          {hasWeight && (
            <>
              , which accounts for approximately{" "}
              <strong>{lesson.domainWeight}</strong> of the {lesson.examCode}{" "}
              exam
            </>
          )}
          . Focus on decision criteria — when to choose one {providerNoun} over
          another.
        </CardContent>
      </Card>

      <CuratedOutline outline={lesson.outline} />

      {lesson.curatedReferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Official references</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {lesson.curatedReferences.map((ref) => (
              <a
                key={ref.url}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                {ref.label}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <AiDeepDive
        content={lesson.content}
        loading={generating}
        streaming={streaming}
        onGenerate={() => handleGenerate(false)}
        onRefresh={lesson.content ? () => handleGenerate(true) : undefined}
        canGenerate={remainingLessons > 0 || Boolean(lesson.content)}
        limitMessage={limitMessage}
      />

      <LessonTutor topicSlug={topicSlug} topicName={lesson.topicName} />

      {(lesson.content?.checkQuestions ?? []).length > 0 && (
        <LessonCheck
          questions={lesson.content!.checkQuestions!}
          savedScore={lesson.checkScore}
          savedTotal={lesson.checkTotal}
          onSubmit={handleCheckSubmit}
          submitting={completing}
        />
      )}

      <LessonActions
        topicName={lesson.topicName}
        status={lesson.status}
        bookmarked={lesson.bookmarked}
        lessonId={lesson.id}
        onMarkComplete={handleMarkComplete}
        onToggleBookmark={handleToggleBookmark}
        completing={completing}
      />

      {nextTopic && (
        <Link
          href={`/learn/${nextTopic.slug}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Next up</span>
            <span className="text-sm font-medium">{nextTopic.topic}</span>
            <span className="text-xs text-muted-foreground">
              {nextTopic.assessed !== false && nextTopic.questionsAnswered > 0
                ? `${nextTopic.mastery}% mastery`
                : "Not practiced yet"}
              {nextTopic.domainWeight ? ` · ${nextTopic.domainWeight} of exam` : ""}
            </span>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}
    </div>
  )
}
