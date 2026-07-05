"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlarmClock,
  ArrowRight,
  Brain,
  CalendarCheck,
  ChevronRight,
  PlayCircle,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useTaskLauncher } from "@/components/plan/use-task-launcher"
import {
  getExamBlueprint,
  WEAK_FOCUS_PRACTICE_QUESTIONS,
} from "@/lib/exams"
import { inferExamFromSessions } from "@/lib/learning/topic-resolver"
import { computeExamReadiness } from "@/lib/progress/readiness"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError } from "@/lib/api/client"

interface NextActionCardProps {
  /** Missed questions due for review today; null while loading. */
  dueCount: number | null
}

interface ActionDef {
  key: string
  icon: LucideIcon
  title: string
  meta: string
  cta: string
  href?: string
  run?: () => void
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The dashboard's single recommendation: a priority ladder picks the one thing
 * worth doing right now — due reviews → in-progress session → today's plan
 * task → weakest-domain drill → start practicing.
 */
export function NextActionCard({ dueCount }: NextActionCardProps) {
  const router = useRouter()
  const sessions = useSessionStore((s) => s.sessions)
  const plan = useSessionStore((s) => s.plan)
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const examAccuracy = useSessionStore((s) => s.examAccuracy)
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const hydrate = useSessionStore((s) => s.hydrate)
  const { launch, launchingId } = useTaskLauncher(plan)
  const [startingDrill, setStartingDrill] = useState(false)

  const { examCode } = useMemo(
    () => inferExamFromSessions(sessions),
    [sessions],
  )
  const blueprint = getExamBlueprint(examCode)

  const weakestDomain = useMemo(() => {
    if (!blueprint) return null
    const readiness = computeExamReadiness(
      blueprint,
      topicMastery,
      examAccuracy[blueprint.examCode],
    )
    if (readiness.totalAnswered === 0) return null
    return readiness.weakestDomains[0] ?? null
  }, [blueprint, topicMastery, examAccuracy])

  const drillCount =
    remaining === Infinity
      ? WEAK_FOCUS_PRACTICE_QUESTIONS
      : Math.min(WEAK_FOCUS_PRACTICE_QUESTIONS, remaining)

  function startDrill() {
    if (!blueprint || !weakestDomain || startingDrill || drillCount < 1) return
    setStartingDrill(true)
    useGenerationStore.getState().startPracticeGeneration(
      {
        description: `Focused practice for ${blueprint.exam} (${blueprint.examCode}). Target my weakest domain: ${weakestDomain.name}. Generate exam-style multiple-choice questions on this domain only.`,
        count: drillCount,
        focusTopics: [weakestDomain.name],
        exam: blueprint.exam,
        examCode: blueprint.examCode,
      },
      {
        onReady: (session) => {
          toast.success("Focused drill ready!")
          router.push(`/quiz/${session.id}`)
          setStartingDrill(false)
        },
        onDone: async () => {
          await hydrate()
        },
        onError: (err) => {
          toast.error(
            err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT"
              ? "Daily question limit reached."
              : err.message,
          )
          setStartingDrill(false)
        },
      },
    )
  }

  const actions: ActionDef[] = []

  if (dueCount != null && dueCount > 0) {
    const mins = Math.max(2, Math.round(dueCount * 0.75))
    actions.push({
      key: "reviews",
      icon: Brain,
      title: `Review ${dueCount} missed question${dueCount === 1 ? "" : "s"}`,
      meta: `Due today · ~${mins} min · your fastest readiness gain`,
      cta: "Start review",
      href: "/practice/missed?due=true",
    })
  }

  const inProgress = sessions
    .filter((s) => s.status === "in-progress")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
  if (inProgress) {
    const total = Math.max(
      inProgress.expectedQuestionCount ?? 0,
      inProgress.questions.length,
    )
    const position = Math.min(inProgress.currentIndex + 1, total)
    const isExam = inProgress.mode === "exam"
    actions.push({
      key: "continue",
      icon: PlayCircle,
      title: `Continue your ${isExam ? "mock exam" : "practice session"}`,
      meta: `${inProgress.examCode} · question ${position}${total > 0 ? ` of ${total}` : ""} · answers saved`,
      cta: "Continue",
      href: isExam ? `/exam/${inProgress.id}` : `/quiz/${inProgress.id}`,
    })
  }

  const today = todayIso()
  const planTask = plan?.tasks.find(
    (t) => t.status !== "done" && t.scheduledDate <= today,
  )
  if (planTask) {
    actions.push({
      key: "plan-task",
      icon: CalendarCheck,
      title: planTask.title,
      meta: `Today's plan · ${planTask.questionCount} questions`,
      cta: launchingId === planTask.id ? "Starting…" : "Start task",
      run: () => launch(planTask),
    })
  }

  if (blueprint && weakestDomain && drillCount >= 1) {
    // Readiness points recovered by lifting this domain to the pass mark —
    // the honest ceiling on what this drill is worth.
    const gain = Math.round(
      (Math.max(0, blueprint.passMark - weakestDomain.mastery) *
        weakestDomain.weightPercent) / 100,
    )
    actions.push({
      key: "drill",
      icon: Target,
      title: `Drill ${weakestDomain.name}`,
      meta: `Your weakest domain · ${weakestDomain.mastery}% mastery${gain >= 1 ? ` · worth up to +${gain} readiness pts` : ""}`,
      cta: startingDrill ? "Starting…" : "Start drill",
      run: startDrill,
    })
  }

  actions.push({
    key: "practice",
    icon: Sparkles,
    title: "Start a practice session",
    meta: "Describe your exam — we'll generate questions built for you",
    cta: "Start practicing",
    href: "/intake",
  })

  const [primary, ...rest] = actions
  const alternates = rest.slice(0, 2)
  const busy = startingDrill || launchingId != null

  return (
    <Card className="relative h-full overflow-hidden border-primary/30 bg-linear-to-br from-primary/15 via-card to-card">
      <CardContent className="flex h-full flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Do this now
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">
            {primary.title}
          </h2>
          <p className="text-sm text-muted-foreground">{primary.meta}</p>
        </div>

        {primary.href ? (
          <Button asChild size="lg" className="w-full">
            <Link href={primary.href}>
              {primary.cta}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : (
          <Button size="lg" className="w-full" disabled={busy} onClick={primary.run}>
            {busy && <Spinner data-icon="inline-start" />}
            {primary.cta}
            {!busy && <ArrowRight data-icon="inline-end" />}
          </Button>
        )}

        {alternates.length > 0 && (
          <div className="mt-auto flex flex-col gap-1.5">
            {alternates.map((a) => {
              const Icon = a.icon
              const inner = (
                <>
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    <span className="text-muted-foreground">Then: </span>
                    <span className="font-medium">{a.title}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </>
              )
              const rowClass =
                "flex w-full items-center gap-2.5 rounded-lg bg-background/40 px-3 py-2 transition-colors hover:bg-background/70"
              return a.href ? (
                <Link key={a.key} href={a.href} className={rowClass}>
                  {inner}
                </Link>
              ) : (
                <button
                  key={a.key}
                  type="button"
                  disabled={busy}
                  onClick={a.run}
                  className={rowClass}
                >
                  {inner}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
