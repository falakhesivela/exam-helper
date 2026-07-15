"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Crosshair,
  ListChecks,
  Settings2,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSessionStore } from "@/lib/store/use-session-store"
import { useGenerationStore } from "@/lib/generation/session-generation"
import {
  ActiveExamBar,
  NoActiveExam,
} from "@/components/exam/active-exam-bar"
import {
  ReadinessBanner,
  useExamReadiness,
} from "@/components/exam/readiness-recommendation"
import { useActiveExam, type ActiveExam } from "@/hooks/use-active-exam"
import { ApiClientError, api } from "@/lib/api/client"
import {
  WEAK_FOCUS_EXAM_MINUTES,
  WEAK_FOCUS_EXAM_QUESTIONS,
  scaledExamParams,
} from "@/lib/exams"
import { cn } from "@/lib/utils"

const QUESTION_PRESETS = [10, 20, 30, 65, 90, 100]
const TIME_PRESETS = [15, 30, 60, 90, 120, 130, 180]

/** Stand-in blueprint shape for custom exams, which have no official length. */
const CUSTOM_EXAM_LENGTH = { questionCount: 65, durationMin: 130 }

type LaunchKey = "full" | "half" | "drill"

interface LaunchOption {
  key: LaunchKey
  icon: LucideIcon
  title: string
  description: string
  questionCount: number
  durationMin: number
  focusDomainIds?: string[]
  /** True when the plan forced a smaller exam than the option wants. */
  scaled: boolean
}

function PresetChip({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-control items-center rounded-md border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
        disabled &&
          "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground",
      )}
    >
      {children}
    </button>
  )
}

/** Shrink an option to what the plan allows, keeping the pace proportional. */
function fitToPlan(
  questionCount: number,
  durationMin: number,
  examCap: number,
  activeExam: ActiveExam,
): { questionCount: number; durationMin: number; scaled: boolean } {
  if (questionCount <= examCap) return { questionCount, durationMin, scaled: false }
  const capped = Math.max(1, examCap)
  if (activeExam.blueprint) {
    return { ...scaledExamParams(activeExam.blueprint, capped), scaled: true }
  }
  return {
    questionCount: capped,
    durationMin: Math.max(
      5,
      Math.round(durationMin * (capped / Math.max(questionCount, 1))),
    ),
    scaled: true,
  }
}

export function ExamConfig() {
  const router = useRouter()
  const { activeExam, userExams, ready } = useActiveExam()
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const maxExamLength = useSessionStore((s) => s.profile.limits.maxExamLength)
  const hydrate = useSessionStore((s) => s.hydrate)
  // Largest exam launchable right now: question quota ∩ per-exam plan cap.
  const examCap = Math.min(remaining, maxExamLength)

  const [starting, setStarting] = useState<LaunchKey | "custom" | null>(null)
  const [advanced, setAdvanced] = useState(false)
  // Null until the user overrides them, so the defaults always track the exam.
  const [customCount, setCustomCount] = useState<number | null>(null)
  const [customMinutes, setCustomMinutes] = useState<number | null>(null)

  const passMark = activeExam?.blueprint?.passMark ?? 72
  const readiness = useExamReadiness(activeExam?.examCode ?? "", passMark)

  const options = useMemo<LaunchOption[]>(() => {
    if (!activeExam) return []
    const full = activeExam.blueprint ?? CUSTOM_EXAM_LENGTH
    const halfCount = Math.max(5, Math.round(full.questionCount / 2))
    const half = activeExam.blueprint
      ? scaledExamParams(activeExam.blueprint, halfCount)
      : {
          questionCount: halfCount,
          durationMin: Math.round(full.durationMin / 2),
        }
    const weakest = readiness?.weakest ?? []

    return [
      {
        key: "full",
        icon: Zap,
        title: "Full mock exam",
        description: activeExam.blueprint
          ? `Real ${activeExam.examCode} length, domain-weighted`
          : "Full-length, weighted across your topics",
        ...fitToPlan(full.questionCount, full.durationMin, examCap, activeExam),
      },
      {
        key: "half",
        icon: Timer,
        title: "Half mock",
        description: "Same conditions, half the sitting",
        ...fitToPlan(half.questionCount, half.durationMin, examCap, activeExam),
      },
      {
        key: "drill",
        icon: Crosshair,
        title: weakest.length > 0 ? "Weak-area drill" : "Quick drill",
        description:
          weakest.length > 0
            ? `Focused on ${weakest.map((w) => w.name).join(" and ")}`
            : "A short timed set to warm up",
        focusDomainIds:
          weakest.length > 0 ? weakest.map((w) => w.domainId) : undefined,
        ...fitToPlan(
          WEAK_FOCUS_EXAM_QUESTIONS,
          WEAK_FOCUS_EXAM_MINUTES,
          examCap,
          activeExam,
        ),
      },
    ]
  }, [activeExam, readiness, examCap])

  // No mock history yet → the realistic simulation is the honest default.
  const recommended: LaunchKey = !readiness
    ? "full"
    : readiness.ready
      ? "full"
      : readiness.weakest.length > 0
        ? "drill"
        : "half"

  const fullOption = options.find((o) => o.key === "full")
  const count = customCount ?? fullOption?.questionCount ?? 20
  const minutes = customMinutes ?? fullOption?.durationMin ?? 30
  const perQuestion = count > 0 ? Math.round((minutes * 60) / count) : 0
  const tightPace = perQuestion > 0 && perQuestion < 30
  const validCount = count >= 1 && count <= 100
  const validMinutes = minutes >= 1 && minutes <= 240

  async function launch(
    key: LaunchKey | "custom",
    questionCount: number,
    durationMin: number,
    focusDomainIds?: string[],
  ) {
    if (starting || !activeExam) return
    if (questionCount > examCap) {
      toast.error(
        remaining < maxExamLength
          ? `Only ${remaining} questions left on your plan`
          : `Your plan caps exams at ${maxExamLength} questions`,
      )
      return
    }
    setStarting(key)
    try {
      useGenerationStore.getState().startExamGeneration(
        {
          questionCount,
          durationSec: durationMin * 60,
          exam: activeExam.exam,
          examCode: activeExam.examCode,
          focusDomainIds,
        },
        {
          onReady: (session) => {
            toast.success("First question ready — you can start the exam")
            router.push(`/exam/${session.id}`)
            setStarting(null)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            if (err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT") {
              toast.error("Question limit reached on your plan.")
            } else {
              toast.error(err.message)
            }
            setStarting(null)
          },
        },
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start exam")
      setStarting(null)
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-col gap-4">
        <CardSkeleton rows={1} />
        <CardSkeleton rows={3} />
      </div>
    )
  }

  if (!activeExam) {
    return <NoActiveExam action="mock exams start in one tap" />
  }

  return (
    <div className="flex flex-col gap-5">
      <ActiveExamBar activeExam={activeExam} userExams={userExams} />

      {readiness && (
        <ReadinessBanner readiness={readiness} passMark={passMark} />
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const Icon = option.icon
          const isRecommended = option.key === recommended
          const busy = starting === option.key
          return (
            <Card
              key={option.key}
              className={cn(
                "flex flex-col",
                isRecommended &&
                  "border-primary/40 bg-linear-to-br from-primary/10 via-card to-card ring-1 ring-primary/20",
              )}
            >
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl border",
                      isRecommended
                        ? "border-primary/30 bg-primary/15 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4.5" />
                  </span>
                  {isRecommended && <Badge>Recommended</Badge>}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{option.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                <p className="text-xs font-medium tabular-nums text-foreground">
                  {option.questionCount} questions · {option.durationMin} min
                  {option.scaled && (
                    <span className="block font-normal text-muted-foreground">
                      Scaled to your plan limit
                    </span>
                  )}
                </p>

                <Button
                  variant={isRecommended ? "default" : "secondary"}
                  disabled={starting !== null}
                  onClick={() =>
                    void launch(
                      option.key,
                      option.questionCount,
                      option.durationMin,
                      option.focusDomainIds,
                    )
                  }
                >
                  {busy ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      Starting…
                    </>
                  ) : (
                    "Start"
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setAdvanced((v) => !v)}
          aria-expanded={advanced}
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings2 className="size-4" />
          {advanced ? "Hide custom setup" : "Custom setup"}
        </button>

        {advanced && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Custom exam</CardTitle>
              <CardDescription>
                Set your own length and time. The clock auto-submits when time
                runs out.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <Field>
                <FieldLabel className="flex items-center gap-1.5">
                  <ListChecks className="size-4 text-muted-foreground" />
                  Number of questions
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {QUESTION_PRESETS.map((n) => (
                    <PresetChip
                      key={n}
                      active={count === n}
                      disabled={n > examCap}
                      title={
                        n > examCap
                          ? `Above your plan's limit of ${examCap} questions — upgrade for full-length exams`
                          : undefined
                      }
                      onClick={() => setCustomCount(n)}
                    >
                      {n}
                    </PresetChip>
                  ))}
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={count}
                    aria-label="Custom number of questions"
                    aria-invalid={!validCount}
                    onChange={(e) => setCustomCount(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel className="flex items-center gap-1.5">
                  <Timer className="size-4 text-muted-foreground" />
                  Time limit (minutes)
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-2">
                  {TIME_PRESETS.map((m) => (
                    <PresetChip
                      key={m}
                      active={minutes === m}
                      onClick={() => setCustomMinutes(m)}
                    >
                      {m}
                    </PresetChip>
                  ))}
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={minutes}
                    aria-label="Custom time limit in minutes"
                    aria-invalid={!validMinutes}
                    onChange={(e) => setCustomMinutes(Number(e.target.value))}
                    className="w-20"
                  />
                </div>
              </Field>

              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
                  tightPace
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary/50 text-muted-foreground",
                )}
              >
                <Timer className="size-4 shrink-0" />
                {validCount && validMinutes ? (
                  <span>
                    About{" "}
                    <span className="font-medium text-foreground">
                      {perQuestion}s
                    </span>{" "}
                    per question
                    {tightPace ? " — that's a tight pace." : "."}
                  </span>
                ) : (
                  <span>Enter a valid question count and time limit.</span>
                )}
              </div>

              <Button
                size="lg"
                disabled={
                  starting !== null ||
                  !validCount ||
                  !validMinutes ||
                  count > examCap
                }
                onClick={() => void launch("custom", count, minutes)}
              >
                {starting === "custom" ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    Starting…
                  </>
                ) : (
                  "Start exam"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {Number.isFinite(remaining) && (
        <p className="text-center text-xs text-muted-foreground">
          {remaining} questions remaining on your plan
          {count > examCap && advanced && (
            <span className="block text-destructive">
              Reduce to {examCap} or fewer questions, or upgrade for full-length
              exams.
            </span>
          )}
        </p>
      )}
    </div>
  )
}
