"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, PlayCircle, Settings2, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { NoActiveExam } from "@/components/exam/active-exam-bar"
import { ClarifyingQuestions } from "@/components/intake/clarifying-questions"
import { useActiveExam } from "@/hooks/use-active-exam"
import { ApiClientError, api } from "@/lib/api/client"
import type { ClarifyingQuestion } from "@/types"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { mapWeakTopicsToDomains, parseMasteryTopicKey } from "@/lib/exams"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

const SIZE_PRESETS = [5, 10, 15, 20] as const
const TIME_PRESETS = [10, 15, 20, 30] as const

const DIFFICULTY_OPTIONS = [
  { value: "mixed", label: "Mixed" },
  { value: "easier", label: "Easier" },
  { value: "harder", label: "Harder" },
] as const

type DifficultyChoice = (typeof DIFFICULTY_OPTIONS)[number]["value"]

/** "weak" | "mixed" | "custom" (free text) | a blueprint domain id. */
type Focus = "weak" | "mixed" | "custom" | (string & {})

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {children}
    </button>
  )
}

/**
 * Starts practice on the exam we already know. Choosing *what* to drill is real
 * content — so the options are on the card, not behind a wizard: weak areas, the
 * whole blueprint, one domain, or a topic typed in. /intake remains for exams we
 * don't know yet.
 *
 * Deep links (Mentor's "quiz me", dashboard drills) land here with
 * `initialTopic` pre-selecting the focus, so every entry point gets the same
 * chance to adjust size and difficulty before anything generates.
 */
export function QuickStartCard({ initialTopic }: { initialTopic?: string }) {
  const router = useRouter()
  const { activeExam, ready } = useActiveExam()
  const sessions = useSessionStore((s) => s.sessions)
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const hydrate = useSessionStore((s) => s.hydrate)

  const [size, setSize] = useState<number>(10)
  const [starting, setStarting] = useState(false)
  // Null = follow the recommended default, which tracks mastery as it changes.
  const [focusOverride, setFocusOverride] = useState<Focus | null>(null)
  const [customTopic, setCustomTopic] = useState("")
  const [difficulty, setDifficulty] = useState<DifficultyChoice>("mixed")
  const [timed, setTimed] = useState(false)
  const [minutes, setMinutes] = useState<number>(15)
  const [moreOptions, setMoreOptions] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [clarifying, setClarifying] = useState<ClarifyingQuestion[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState<
    Record<string, string>
  >({})
  /** The topic text the current clarifying questions were asked about. */
  const [clarifiedTopic, setClarifiedTopic] = useState<string | null>(null)
  const clarifyAbortRef = useRef<AbortController | null>(null)

  // Abort a streaming clarify request if the user navigates away mid-analysis.
  useEffect(() => () => clarifyAbortRef.current?.abort(), [])

  // A deep-linked topic pre-selects the focus once the exam is known: a domain
  // chip when the name matches one, free text otherwise. Applied once, and only
  // until the user picks something themselves.
  const appliedInitialTopic = useRef(false)
  useEffect(() => {
    if (!initialTopic || !ready || appliedInitialTopic.current) return
    appliedInitialTopic.current = true
    setFocusOverride((current) => {
      if (current !== null) return current
      const match = (activeExam?.blueprint?.domains ?? []).find(
        (d) => d.name.toLowerCase() === initialTopic.toLowerCase(),
      )
      if (match) return match.id
      setCustomTopic(initialTopic)
      return "custom"
    })
  }, [initialTopic, ready, activeExam])

  const maxQuestions = Math.min(20, remaining)

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

  /** The domains we'd pick for them: weakest first, from real mastery data. */
  const weakDomainIds = useMemo(() => {
    const blueprint = activeExam?.blueprint
    if (!blueprint) return undefined
    const weakest = topicMastery
      .filter((t) => {
        const parsed = parseMasteryTopicKey(t.topic)
        if (!parsed) return true
        return (
          parsed.examCode.toUpperCase() === blueprint.examCode.toUpperCase()
        )
      })
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3)
    if (weakest.length === 0) return undefined
    const domains = mapWeakTopicsToDomains(
      blueprint,
      weakest.map((t) => t.topic),
    ).map((d) => d.id)
    return domains.length > 0 ? domains : undefined
  }, [activeExam, topicMastery])

  const domains = activeExam?.blueprint?.domains ?? []

  /** Mastery per domain, so the choice is informed rather than a guess. */
  const masteryByDomain = useMemo(() => {
    const map: Record<string, number> = {}
    for (const t of topicMastery) {
      if (
        t.domainId &&
        t.examCode === activeExam?.examCode &&
        t.questionsAnswered >= 3
      ) {
        map[t.domainId] = Math.round(t.mastery)
      }
    }
    return map
  }, [topicMastery, activeExam])

  const defaultFocus: Focus = weakDomainIds ? "weak" : "mixed"
  const focus = focusOverride ?? defaultFocus
  const focusedDomain = domains.find((d) => d.id === focus)
  const topic = customTopic.trim()
  const readyToStart = focus !== "custom" || topic.length >= 3
  // Editing the topic after answering retires those questions: they were about
  // the old text, and pressing Start re-analyzes the new one.
  const showClarifying =
    focus === "custom" && clarifying.length > 0 && clarifiedTopic === topic

  const examLabel = activeExam
    ? `${activeExam.exam}${activeExam.blueprint ? ` (${activeExam.examCode})` : ""}`
    : ""

  const description =
    focus === "custom"
      ? `I'm preparing for the ${examLabel} certification exam. Generate practice questions specifically on: ${topic}.`
      : focusedDomain
        ? `I'm preparing for the ${examLabel} certification exam. Generate practice questions on the "${focusedDomain.name}" domain: ${focusedDomain.topics.join(", ")}.`
        : `I'm preparing for the ${examLabel} certification exam. Generate practice questions across the main exam domains.`

  /**
   * A typed topic is the only ambiguous input here — the chips are all derived
   * from the blueprint — so it's the only one worth asking the AI about. If it
   * has nothing to ask, we generate straight away rather than stall the user.
   */
  async function analyzeTopic() {
    if (!activeExam) return
    setAnalyzing(true)
    setClarifying([])
    setClarificationAnswers({})
    const controller = new AbortController()
    clarifyAbortRef.current = controller
    try {
      const result = await api.clarify(description, {
        signal: controller.signal,
        onQuestion: (index, question) => {
          setClarifying((prev) => {
            const next = [...prev]
            next[index] = question
            return next
          })
        },
      })
      setClarifiedTopic(topic)
      if (result.needsClarification && result.questions.length > 0) {
        setClarifying(result.questions)
        setAnalyzing(false)
        return
      }
      setClarifying([])
      setAnalyzing(false)
      generate()
    } catch (err) {
      setAnalyzing(false)
      if (err instanceof Error && err.name === "AbortError") return
      // Clarification is a nicety, never a gate — fall through to generation.
      setClarifiedTopic(topic)
      generate()
    } finally {
      clarifyAbortRef.current = null
    }
  }

  function startPractice() {
    if (starting || analyzing || !activeExam) return
    if (size > remaining) {
      toast.error(`Only ${remaining} questions remaining on your plan`)
      return
    }
    if (focus === "custom" && topic.length < 3) {
      toast.error("Tell us which topic to practice")
      return
    }
    // Ask about a topic we haven't analyzed yet; editing it re-opens the check.
    if (focus === "custom" && clarifiedTopic !== topic) {
      void analyzeTopic()
      return
    }
    generate()
  }

  function generate() {
    if (!activeExam) return
    // Key answers by question text so the prompt reads "- How soon is your
    // exam?: Within 2 weeks" instead of "- c1: …".
    const clarifications: Record<string, string> = {}
    if (showClarifying) {
      for (const q of clarifying) {
        const answer = clarificationAnswers[q.id]
        if (answer) clarifications[q.question] = answer
      }
    }

    setStarting(true)
    try {
      useGenerationStore.getState().startPracticeGeneration(
        {
          description,
          clarifications,
          count: size,
          exam: activeExam.exam,
          examCode: activeExam.examCode,
          adaptive: focus === "weak" && weakDomainIds !== undefined,
          focusDomainIds:
            focus === "weak"
              ? weakDomainIds
              : focusedDomain
                ? [focusedDomain.id]
                : undefined,
          focusTopics: focus === "custom" ? [topic] : undefined,
          difficulty: difficulty === "mixed" ? undefined : difficulty,
          durationSec: timed ? minutes * 60 : undefined,
        },
        {
          onReady: (session) => {
            toast.success("Session started — first question is ready")
            router.push(`/quiz/${session.id}`)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            setStarting(false)
            if (err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT") {
              toast.error(
                "Question limit reached. Upgrade your plan for more practice.",
              )
            } else {
              toast.error(err.message)
            }
          },
        },
      )
    } catch (err) {
      setStarting(false)
      toast.error(err instanceof Error ? err.message : "Generation failed")
    }
  }

  if (!ready) return <CardSkeleton rows={3} />
  if (!activeExam) {
    return <NoActiveExam action="practice sessions start from one card" />
  }

  const inProgressTotal = inProgress
    ? Math.max(
        inProgress.expectedQuestionCount ?? 0,
        inProgress.questions.length,
      )
    : 0

  return (
    <div className="flex flex-col gap-3">
      {/* Resuming is its own row, so setting up a new session never replaces it. */}
      {inProgress && (
        <Card className="border-primary/30 bg-linear-to-br from-primary/10 via-card to-card">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <PlayCircle className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Continue where you left off</p>
              <p className="truncate text-sm text-muted-foreground">
                {inProgress.examCode} · question{" "}
                {Math.min(inProgress.currentIndex + 1, inProgressTotal)} of{" "}
                {inProgressTotal}
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href={`/quiz/${inProgress.id}`}>
                Continue
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {inProgress ? "Start a new session" : "Start practice"} ·{" "}
                {activeExam.blueprint ? activeExam.examCode : activeExam.exam}
              </p>
              <p className="text-sm text-muted-foreground text-pretty">
                Fresh AI questions. Pick what to work on, or leave the
                recommendation as-is.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What do you want to practice?
            </p>
            <div className="flex flex-wrap gap-2">
              {weakDomainIds && (
                <Chip
                  active={focus === "weak"}
                  disabled={starting}
                  onClick={() => setFocusOverride("weak")}
                >
                  Your weak areas
                </Chip>
              )}
              <Chip
                active={focus === "mixed"}
                disabled={starting}
                onClick={() => setFocusOverride("mixed")}
              >
                {activeExam.blueprint ? "Whole blueprint" : "Whole exam"}
              </Chip>
              {domains.map((domain) => {
                const mastery = masteryByDomain[domain.id]
                return (
                  <Chip
                    key={domain.id}
                    active={focus === domain.id}
                    disabled={starting}
                    onClick={() => setFocusOverride(domain.id)}
                  >
                    {domain.name}
                    {mastery != null && (
                      <span className="ml-1.5 text-xs tabular-nums opacity-70">
                        {mastery}%
                      </span>
                    )}
                  </Chip>
                )
              })}
              <Chip
                active={focus === "custom"}
                disabled={starting}
                onClick={() => setFocusOverride("custom")}
              >
                A specific topic…
              </Chip>
            </div>

            {focus === "custom" && (
              <Input
                autoFocus
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                disabled={starting || analyzing}
                placeholder="e.g. S3 lifecycle policies, VPC peering, IAM condition keys"
                aria-label="Topic to practice"
                className="mt-1"
              />
            )}
          </div>

          {showClarifying && (
            <ClarifyingQuestions
              questions={clarifying}
              answers={clarificationAnswers}
              onAnswerChange={(id, value) =>
                setClarificationAnswers((prev) => {
                  const next = { ...prev }
                  if (value) next[id] = value
                  else delete next[id]
                  return next
                })
              }
            />
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              How many questions?
            </p>
            <div className="flex flex-wrap gap-2">
              {SIZE_PRESETS.map((n) => (
                <Chip
                  key={n}
                  active={size === n}
                  disabled={n > maxQuestions || starting}
                  onClick={() => setSize(n)}
                >
                  {n}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setMoreOptions((v) => !v)}
              aria-expanded={moreOptions}
              className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings2 className="size-4" />
              {moreOptions ? "Fewer options" : "More options"}
            </button>

            {moreOptions && (
              <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Difficulty
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <Chip
                        key={opt.value}
                        active={difficulty === opt.value}
                        disabled={starting || analyzing}
                        onClick={() => setDifficulty(opt.value)}
                      >
                        {opt.label}
                      </Chip>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor="timed" className="text-sm font-medium">
                      Timed practice
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Optional session time limit
                    </p>
                  </div>
                  <Switch
                    id="timed"
                    checked={timed}
                    onCheckedChange={setTimed}
                    disabled={starting || analyzing}
                  />
                </div>

                {timed && (
                  <div className="flex flex-wrap gap-2">
                    {TIME_PRESETS.map((m) => (
                      <Chip
                        key={m}
                        active={minutes === m}
                        disabled={starting || analyzing}
                        onClick={() => setMinutes(m)}
                      >
                        {m} min
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="sm:flex-1"
              disabled={
                starting || analyzing || size > maxQuestions || !readyToStart
              }
              onClick={startPractice}
            >
              {starting || analyzing ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {analyzing
                    ? "Checking your topic…"
                    : "Generating your session…"}
                </>
              ) : (
                <>
                  <Target data-icon="inline-start" />
                  {showClarifying
                    ? `Generate ${size} questions`
                    : `Start ${size} questions`}
                </>
              )}
            </Button>
            <Button asChild variant="ghost" size="lg" className="sm:w-auto">
              <Link href="/intake">Describe it instead</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
