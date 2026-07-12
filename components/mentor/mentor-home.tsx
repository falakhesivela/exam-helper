"use client"

import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Gauge,
  Sparkles,
  Target,
} from "lucide-react"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MentorMobileThreads } from "@/components/mentor/mentor-workspace"
import { getExamBlueprint } from "@/lib/exams"
import { computeExamReadiness } from "@/lib/progress/readiness"
import { useSessionStore } from "@/lib/store/use-session-store"

function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  const target = new Date(`${date}T00:00:00`)
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86_400_000))
}

export function MentorHome() {
  const activeExamCode = useSessionStore((state) => state.activeExamCode)
  const topicMastery = useSessionStore((state) => state.topicMastery)
  const examAccuracy = useSessionStore((state) => state.examAccuracy)
  const userExams = useSessionStore((state) => state.userExams)

  const blueprint = activeExamCode ? getExamBlueprint(activeExamCode) : null
  const readiness = blueprint
    ? computeExamReadiness(
        blueprint,
        topicMastery,
        examAccuracy[blueprint.examCode],
      )
    : null
  const activeExam = userExams.find(
    (exam) => exam.examCode.toUpperCase() === activeExamCode?.toUpperCase(),
  )
  const days = daysUntil(activeExam?.examDate)
  const weakest = readiness?.weakestDomains[0]

  const seed = weakest
    ? `Help me improve ${weakest.name}. I am currently at ${Math.round(
        weakest.mastery,
      )}% mastery and it represents ${weakest.weightPercent}% of the exam.`
    : "Review my progress and tell me what I should study next."

  return (
    <div className="no-scrollbar h-full overflow-y-auto p-5 sm:p-7">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Sparkles className="size-3" />
              Personal coach
            </Badge>
            {activeExamCode && <Badge variant="secondary">{activeExamCode}</Badge>}
          </div>
          <MentorMobileThreads />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            What should we work on today?
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground text-pretty">
            Mentor combines your exam blueprint, readiness, and recent practice
            to turn questions into focused study actions.
          </p>
        </div>
      </motion.header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-primary/25 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="size-4 text-primary" />
                Today&apos;s focus
              </CardTitle>
              {weakest && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(weakest.mastery)}% mastery
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">
                {weakest?.name ?? "Build your first readiness signal"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {weakest
                  ? `${weakest.weightPercent}% of the exam. Ask for an explanation, then reinforce it with graded practice.`
                  : "Answer a few questions and Mentor will identify your highest-impact domain."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/mentor/new?seed=${encodeURIComponent(seed)}`}>
                  Work on this
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/plan">View study plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" />
              Exam snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Readiness</span>
                <span className="font-semibold">{readiness?.score ?? "—"}%</span>
              </div>
              <Progress value={readiness?.score ?? 0} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted/60 p-3">
                <CalendarDays className="mb-2 size-4 text-muted-foreground" />
                <p className="font-medium">{days ?? "—"}</p>
                <p className="text-xs text-muted-foreground">days to exam</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <BookOpen className="mb-2 size-4 text-muted-foreground" />
                <p className="font-medium">
                  {readiness?.domainsCovered ?? 0}/{readiness?.totalDomains ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">domains covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="mt-6" aria-labelledby="mentor-start-title">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 id="mentor-start-title" className="font-semibold">
              Start with a goal
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a direction or ask anything.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/mentor/new">Open blank chat</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: "Explain a weak domain",
              body: "Get a concise explanation grounded in the blueprint.",
              prompt: weakest
                ? `Explain ${weakest.name} from first principles, then give me a real exam example.`
                : "Explain the most important domain in my exam blueprint.",
            },
            {
              title: "Check my readiness",
              body: "Understand your score and the fastest path to the pass mark.",
              prompt:
                "Assess my current readiness. What is the biggest risk and what should I fix first?",
            },
            {
              title: "Plan my next week",
              body: "Turn your deadline and weak areas into a realistic schedule.",
              prompt:
                "Build me a focused seven-day study plan based on my weak domains and exam date.",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={`/mentor/new?seed=${encodeURIComponent(item.prompt)}`}
              className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="text-sm font-medium group-hover:text-primary">
                {item.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
