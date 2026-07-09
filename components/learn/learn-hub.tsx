"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  Lightbulb,
  Sparkles,
  Target,
} from "lucide-react"
import { useSessionStore } from "@/lib/store/use-session-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { LearnTopic } from "@/types"
import { cn } from "@/lib/utils"

interface LearnHubProps {
  topics: LearnTopic[]
}

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

function isAssessed(t: LearnTopic): boolean {
  return t.assessed !== false && t.questionsAnswered > 0
}

function parseWeight(weight?: string): number {
  const n = Number.parseFloat(weight?.replace("%", "") ?? "")
  return Number.isNaN(n) ? -1 : n
}

function statusLabel(status: LearnTopic["lessonStatus"]) {
  switch (status) {
    case "completed":
      return "Completed"
    case "started":
      return "In progress"
    default:
      return "Not started"
  }
}

function StatusIcon({ status }: { status: LearnTopic["lessonStatus"] }) {
  if (status === "completed") {
    return <CheckCircle2 className="size-4 text-success" />
  }
  if (status === "started") {
    return <CircleDot className="size-4 text-primary" />
  }
  return <Circle className="size-4 text-muted-foreground" />
}

function TopicCard({ topic: t, showDomain }: { topic: LearnTopic; showDomain: boolean }) {
  const assessed = isAssessed(t)
  return (
    <Link href={`/learn/${t.slug}`}>
      <Card
        className={cn(
          "transition-colors hover:border-primary/40",
          assessed && t.mastery < 60 && "border-primary/20",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">{t.topic}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2">
                <StatusIcon status={t.lessonStatus} />
                {statusLabel(t.lessonStatus)}
                {showDomain && t.domainName && (
                  <Badge variant="outline" className="text-xs">
                    {t.domainName}
                    {t.domainWeight ? ` · ${t.domainWeight}` : ""}
                  </Badge>
                )}
                {t.hasAiContent && (
                  <Badge variant="secondary" className="text-xs">
                    AI lesson
                  </Badge>
                )}
                {t.hasLab && (
                  <Badge variant="outline" className="text-xs text-primary">
                    Hands-on
                  </Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {t.bookmarked && (
                <BookmarkCheck className="size-4 text-primary" aria-label="Bookmarked" />
              )}
              {assessed ? (
                <span className="text-sm font-medium text-muted-foreground">
                  {t.mastery}%
                </span>
              ) : (
                <Badge variant="outline" className="text-xs font-normal">
                  New
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {assessed ? (
            <>
              <Progress value={t.mastery} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {t.questionsAnswered} questions answered
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not practiced yet — start with the lesson
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

/** Collapsible exam-taking tips (static catalog content, zero AI cost). */
function ExamTipsCard() {
  const tips = useSessionStore((s) => s.examTips)
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const [open, setOpen] = useState(false)

  if (tips.length === 0) return null

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Target className="size-4 text-primary" />
          Exam tips{activeExamCode ? ` · ${activeExamCode}` : ""}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <CardContent className="flex flex-col gap-3 pt-0">
          {tips.map((tip) => (
            <div key={tip.title} className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {tip.body}
              </p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}

/** Coverage summary + lens filters over the full exam syllabus. */
export function LearnHub({ topics }: LearnHubProps) {
  const [lens, setLens] = useState<Lens>("recommended")

  const studied = topics.filter((t) => t.lessonStatus !== "not-started").length
  const mastered = topics.filter((t) => isAssessed(t) && t.mastery >= 80).length

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

  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <BookOpen className="size-10 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <p className="font-medium">No topics yet</p>
            <p className="text-sm text-muted-foreground text-pretty">
              Set up your exam with a quick practice session to unlock your
              personalized syllabus.
            </p>
          </div>
          <Link
            href="/intake"
            className="text-sm font-medium text-primary hover:underline"
          >
            Start practicing
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
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
        </CardContent>
      </Card>

      <ExamTipsCard />

      {topics.some((t) => t.hasAiContent) && (
        <Link href="/learn/facts">
          <Card className="transition-colors hover:border-primary/40">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="size-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Key-fact flashcards</span>
                  <span className="text-xs text-muted-foreground">
                    Spaced review of facts from your lessons
                  </span>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

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
              <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <TopicCard key={t.slug} topic={t} showDomain />
          ))}
        </div>
      )}
    </div>
  )
}
