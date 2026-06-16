"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlarmClock, ListChecks, Sparkles, Timer, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useSessionStore } from "@/lib/store/use-session-store"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { ApiClientError } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const QUESTION_PRESETS = [10, 20, 30, 65]
const TIME_PRESETS = [15, 30, 60, 130] // minutes

const AUTO = { questionCount: 20, durationMin: 30 }

const CUSTOM_EXAM_CODE = "__custom"

interface ExamOption {
  exam: string
  examCode: string
  /** Real-world reference: number of questions and duration in minutes. */
  realistic: { questionCount: number; durationMin: number }
}

const EXAM_OPTIONS: ExamOption[] = [
  {
    exam: "AWS Certified Solutions Architect – Associate",
    examCode: "SAA-C03",
    realistic: { questionCount: 65, durationMin: 130 },
  },
  {
    exam: "AWS Certified Cloud Practitioner",
    examCode: "CLF-C02",
    realistic: { questionCount: 65, durationMin: 90 },
  },
  {
    exam: "Microsoft Azure Fundamentals",
    examCode: "AZ-900",
    realistic: { questionCount: 40, durationMin: 45 },
  },
  {
    exam: "Microsoft Certified: Azure Administrator Associate",
    examCode: "AZ-104",
    realistic: { questionCount: 50, durationMin: 100 },
  },
  {
    exam: "Google Cloud Associate Cloud Engineer",
    examCode: "GCP-ACE",
    realistic: { questionCount: 50, durationMin: 120 },
  },
  {
    exam: "CompTIA Security+",
    examCode: "SY0-701",
    realistic: { questionCount: 90, durationMin: 90 },
  },
]

function PresetChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function ExamConfig() {
  const router = useRouter()
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const hydrate = useSessionStore((s) => s.hydrate)
  const isPro = remaining === Infinity

  const [count, setCount] = useState(AUTO.questionCount)
  const [minutes, setMinutes] = useState(AUTO.durationMin)
  const [starting, setStarting] = useState(false)
  const [selectedCode, setSelectedCode] = useState(EXAM_OPTIONS[0].examCode)
  const [customExam, setCustomExam] = useState("")
  const [customCode, setCustomCode] = useState("")

  const isCustomExam = selectedCode === CUSTOM_EXAM_CODE
  const selectedOption = EXAM_OPTIONS.find((o) => o.examCode === selectedCode)
  const activeExam = isCustomExam
    ? { exam: customExam.trim(), examCode: customCode.trim() || "CUSTOM" }
    : { exam: selectedOption!.exam, examCode: selectedOption!.examCode }
  const validExam = !isCustomExam || customExam.trim().length >= 3

  const perQuestion = count > 0 ? Math.round((minutes * 60) / count) : 0
  const tightPace = perQuestion > 0 && perQuestion < 30
  const validCount = count >= 1 && count <= 100
  const validMinutes = minutes >= 1 && minutes <= 240

  async function launch(questionCount: number, durationMin: number) {
    if (starting) return
    if (!validExam) {
      toast.error("Tell us which exam you want to practice")
      return
    }
    setStarting(true)
    try {
      useGenerationStore.getState().startExamGeneration(
        {
          questionCount,
          durationSec: durationMin * 60,
          exam: activeExam.exam,
          examCode: activeExam.examCode,
        },
        {
          onReady: (session) => {
            toast.success("Exam started — good luck!")
            router.push(`/exam/${session.id}`)
            setStarting(false)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            if (err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT") {
              toast.error("Daily question limit reached.")
            } else {
              toast.error(err.message)
            }
            setStarting(false)
          },
        },
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start exam")
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Exam selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            Which exam?
          </CardTitle>
          <CardDescription>
            Pick the certification you&apos;re studying for, or add your own.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {EXAM_OPTIONS.map((option) => (
              <PresetChip
                key={option.examCode}
                active={selectedCode === option.examCode}
                onClick={() => setSelectedCode(option.examCode)}
              >
                {option.examCode}
              </PresetChip>
            ))}
            <PresetChip
              active={isCustomExam}
              onClick={() => setSelectedCode(CUSTOM_EXAM_CODE)}
            >
              Custom…
            </PresetChip>
          </div>

          {isCustomExam ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Field className="flex-1">
                <FieldLabel htmlFor="custom-exam-name">Exam name</FieldLabel>
                <Input
                  id="custom-exam-name"
                  placeholder="e.g. HashiCorp Terraform Associate"
                  value={customExam}
                  aria-invalid={!validExam}
                  onChange={(e) => setCustomExam(e.target.value)}
                />
              </Field>
              <Field className="sm:w-44">
                <FieldLabel htmlFor="custom-exam-code">
                  Code (optional)
                </FieldLabel>
                <Input
                  id="custom-exam-code"
                  placeholder="e.g. TA-003"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                />
              </Field>
            </div>
          ) : (
            <FieldDescription>{selectedOption!.exam}</FieldDescription>
          )}
        </CardContent>
      </Card>

      {/* Auto-generated exam */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Recommended
              </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              Auto-generate an exam
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              We&apos;ll assemble a balanced {AUTO.questionCount}-question exam
              with a {AUTO.durationMin}-minute limit — just hit start.
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0"
            disabled={starting || !validExam}
            onClick={() => launch(AUTO.questionCount, AUTO.durationMin)}
          >
            {starting ? (
              <>
                <Spinner data-icon="inline-start" />
                Starting…
              </>
            ) : (
              <>
                <Zap data-icon="inline-start" />
                Auto-generate &amp; start
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Custom exam */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlarmClock className="size-4 text-primary" />
            Customize your exam
          </CardTitle>
          <CardDescription>
            Set how many questions and how long you have. The clock auto-submits
            when time runs out.
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
                  onClick={() => setCount(n)}
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
                onChange={(e) => setCount(Number(e.target.value))}
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
                  onClick={() => setMinutes(m)}
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
                onChange={(e) => setMinutes(Number(e.target.value))}
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

          {selectedOption && (
            <button
              type="button"
              onClick={() => {
                setCount(selectedOption.realistic.questionCount)
                setMinutes(selectedOption.realistic.durationMin)
              }}
              className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Match the real {selectedOption.examCode} (
              {selectedOption.realistic.questionCount} questions ·{" "}
              {selectedOption.realistic.durationMin} min)
            </button>
          )}

          <Button
            size="lg"
            disabled={starting || !validCount || !validMinutes || !validExam}
            onClick={() => launch(count, minutes)}
          >
            {starting ? (
              <>
                <Spinner data-icon="inline-start" />
                Starting…
              </>
            ) : (
              "Start exam"
            )}
          </Button>

          {!isPro && (
            <p className="text-center text-xs text-muted-foreground">
              {remaining} free questions remaining today
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
