"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { AnimatePresence, motion } from "motion/react"
import { FileText, Sparkles, UploadCloud, Wand2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { useSessionStore } from "@/lib/store/use-session-store"
import { mockClarifyingQuestions } from "@/lib/mock-data"
import { api, ApiClientError, USE_MOCKS } from "@/lib/api/client"
import { toast } from "sonner"
import { AnalyzeProgress, GenerateProgress } from "@/components/ai/generate-progress"
import { ClarifyingQuestions } from "@/components/intake/clarifying-questions"
import { useGenerationStore } from "@/lib/generation/session-generation"
import {
  getExamBlueprint,
  listExamPresetsByProvider,
  mapWeakTopicsToDomains,
  parseMasteryTopicKey,
} from "@/lib/exams"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { ClarifyingQuestion } from "@/types"
import { cn } from "@/lib/utils"

const intakeSchema = z.object({
  description: z
    .string()
    .min(15, "Tell us a bit more about your exam and weak areas (15+ characters)."),
})

type IntakeValues = z.infer<typeof intakeSchema>

const EXAMPLE_PROMPTS = [
  "I'm taking the AWS SAA-C03 exam and I'm weak in networking and security.",
  "Azure AZ-900 fundamentals — I keep mixing up storage tiers.",
  "Google Cloud Associate Engineer, focus on IAM and VPCs.",
]

const SESSION_SIZE_PRESETS = [5, 10, 15, 20] as const

function SessionSizeChip({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
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

type Phase = "describe" | "analyzing" | "clarify" | "generating"

interface IntakeFormProps {
  initialTopic?: string
  initialExamCode?: string
}

export function IntakeForm({
  initialTopic,
  initialExamCode,
}: IntakeFormProps = {}) {
  const router = useRouter()
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const topicMastery = useSessionStore((s) => s.topicMastery)
  const hydrate = useSessionStore((s) => s.hydrate)

  const [phase, setPhase] = useState<Phase>("describe")
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileId, setFileId] = useState<string | undefined>()
  const [clarifying, setClarifying] = useState<ClarifyingQuestion[]>(
    USE_MOCKS ? mockClarifyingQuestions : [],
  )
  const [clarificationAnswers, setClarificationAnswers] = useState<
    Record<string, string>
  >({})
  const [analyzeStatus, setAnalyzeStatus] = useState("Analyzing your exam goals…")
  const [generateStatus, setGenerateStatus] = useState("Generating exam-style questions…")
  const [generateMeta, setGenerateMeta] = useState<{
    exam?: string
    examCode?: string
    focusTopics?: string[]
  }>({})
  const [questionPreviews, setQuestionPreviews] = useState<string[]>([])
  const [completedQuestions, setCompletedQuestions] = useState(0)
  const [isClarifyStreaming, setIsClarifyStreaming] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [questionCount, setQuestionCount] = useState(5)
  const [selectedPresetCode, setSelectedPresetCode] = useState<string | null>(null)
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false)
  const [timedPractice, setTimedPractice] = useState(false)
  const [practiceMinutes, setPracticeMinutes] = useState(15)
  const presetGroups = listExamPresetsByProvider()
  const isPro = useSessionStore((s) => s.profile.plan === "pro")
  const maxQuestions = isPro ? 20 : Math.min(20, remaining)
  const selectedPreset = selectedPresetCode
    ? presetGroups
        .flatMap((g) => g.presets)
        .find((p) => p.examCode === selectedPresetCode)
    : undefined

  const adaptiveFocusDomainIds = useMemo(() => {
    if (!adaptiveEnabled || !selectedPreset) return undefined
    const blueprint = getExamBlueprint(selectedPreset.examCode)
    if (!blueprint) return undefined
    const relevant = topicMastery.filter((t) => {
      const parsed = parseMasteryTopicKey(t.topic)
      if (!parsed) return true
      return parsed.examCode.toUpperCase() === blueprint.examCode.toUpperCase()
    })
    const weakest = [...relevant]
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3)
    if (weakest.length === 0) return undefined
    return mapWeakTopicsToDomains(
      blueprint,
      weakest.map((t) => t.topic),
    ).map((d) => d.id)
  }, [adaptiveEnabled, selectedPreset, topicMastery])

  const form = useForm<IntakeValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: { description: "" },
    mode: "onChange",
  })

  const description =
    useWatch({ control: form.control, name: "description" }) ?? ""

  useEffect(() => {
    if (!initialTopic) return
    const prefill = initialExamCode
      ? `I'm studying for ${initialExamCode} and want focused practice on ${initialTopic}. Generate exam-style questions on this topic.`
      : `I want focused practice on ${initialTopic}. Generate exam-style questions on this topic.`
    form.setValue("description", prefill, { shouldValidate: true })
  }, [initialTopic, initialExamCode, form])

  function applyPreset(examCode: string, examName: string) {
    setSelectedPresetCode(examCode)
    form.setValue(
      "description",
      `I'm preparing for the ${examName} (${examCode}) certification exam. Generate practice questions across the main exam domains.`,
      { shouldValidate: true },
    )
  }

  async function onSubmitDescription(values: IntakeValues) {
    if (USE_MOCKS) {
      setClarifying(mockClarifyingQuestions)
      setPhase("clarify")
      return
    }

    setPhase("analyzing")
    setClarifying([])
    setAnalyzeStatus("Analyzing your exam goals…")
    setIsClarifyStreaming(true)
    try {
      const result = await api.clarify(values.description, {
        onStatus: setAnalyzeStatus,
        onQuestion: (index, question) => {
          setClarifying((prev) => {
            const next = [...prev]
            next[index] = question
            return next
          })
        },
      })
      setClarifying(result.needsClarification ? result.questions : [])
      setPhase("clarify")
    } catch (err) {
      setPhase("describe")
      toast.error(err instanceof Error ? err.message : "Could not analyze description")
    } finally {
      setIsClarifyStreaming(false)
    }
  }

  async function handleGenerate() {
    if (!isPro && questionCount > remaining) {
      toast.error(`Only ${remaining} free questions remaining today`)
      return
    }
    setPhase("generating")
    setGenerateStatus("Generating exam-style questions…")
    setGenerateMeta({})
    setQuestionPreviews([])
    setCompletedQuestions(0)

    if (USE_MOCKS) {
      const text = form.getValues("description").toLowerCase()
      const examCode = text.includes("az-900")
        ? "AZ-900"
        : text.includes("google") || text.includes("gcp")
          ? "GCP-ACE"
          : "SAA-C03"
      const exam = text.includes("az-900")
        ? "Microsoft Azure Fundamentals"
        : examCode === "GCP-ACE"
          ? "Google Cloud Associate Engineer"
          : "AWS Certified Solutions Architect – Associate"
      const focus: string[] = []
      if (text.includes("network")) focus.push("Networking")
      if (text.includes("security") || text.includes("iam")) focus.push("Security & Identity")
      if (text.includes("storage")) focus.push("Storage")
      if (focus.length === 0) focus.push("Mixed topics")

      const id = await useSessionStore.getState().startSession(exam, examCode, focus)
      toast.success("Your practice session is ready")
      router.push(`/quiz/${id}`)
      return
    }

    try {
      useGenerationStore.getState().startPracticeGeneration(
        {
          description: form.getValues("description"),
          clarifications: clarificationAnswers,
          fileId,
          count: questionCount,
          focusTopics: initialTopic ? [initialTopic] : undefined,
          exam: selectedPreset ? selectedPreset.exam : undefined,
          examCode: selectedPreset?.examCode,
          adaptive: adaptiveEnabled,
          focusDomainIds: adaptiveFocusDomainIds,
          durationSec: timedPractice ? practiceMinutes * 60 : undefined,
        },
        {
          onStatus: setGenerateStatus,
          onMetadata: setGenerateMeta,
          onQuestionPreview: (index, preview) => {
            if (preview.topic) {
              setQuestionPreviews((prev) => {
                const next = [...prev]
                next[index] = preview.topic!
                return next
              })
            }
          },
          onQuestion: (index) => {
            setCompletedQuestions(index + 1)
          },
          onReady: (session) => {
            toast.success("Session started — first question is ready")
            router.push(`/quiz/${session.id}`)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            setPhase("clarify")
            if (err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT") {
              toast.error(
                "Daily question limit reached. Upgrade to Pro for unlimited practice.",
              )
            } else {
              toast.error(err.message)
            }
          },
        },
      )
    } catch (err) {
      setPhase("clarify")
      toast.error(err instanceof Error ? err.message : "Generation failed")
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    if (USE_MOCKS) {
      toast.success(`Attached ${file.name}`)
      return
    }

    setUploading(true)
    try {
      const { fileId: id } = await api.uploadPdf(file)
      setFileId(id)
      toast.success(`Attached ${file.name}`)
    } catch (err) {
      setFileName(null)
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!initialTopic && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick start from a preset</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {presetGroups.map((group) => (
              <div key={group.provider} className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {group.provider}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.presets.map((preset) => (
                    <SessionSizeChip
                      key={preset.examCode}
                      active={selectedPresetCode === preset.examCode}
                      onClick={() => applyPreset(preset.examCode, preset.exam)}
                    >
                      {preset.examCode}
                    </SessionSizeChip>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            Describe your exam
            {initialTopic && (
              <Badge variant="secondary" className="font-normal">
                Focus: {initialTopic}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmitDescription)}>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.description}>
                <FieldLabel htmlFor="description">
                  What are you preparing for?
                </FieldLabel>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="e.g. I'm taking the AWS SAA exam in 3 weeks and I'm weak in networking and security…"
                  aria-invalid={!!form.formState.errors.description}
                  disabled={phase === "analyzing" || phase === "generating"}
                  {...form.register("description")}
                />
                <FieldDescription>
                  {form.formState.errors.description?.message ??
                    "Mention the exam name and any topics you find difficult."}
                </FieldDescription>
              </Field>

              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => form.setValue("description", p, { shouldValidate: true })}
                    className="rounded-md border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <Field>
                <FieldLabel htmlFor="syllabus">Syllabus PDF (optional)</FieldLabel>
                {fileName ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      {uploading ? (
                        <Spinner className="size-4 shrink-0" />
                      ) : (
                        <FileText className="size-4 shrink-0 text-primary" />
                      )}
                      <span className="truncate">
                        {uploading ? "Uploading…" : fileName}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      disabled={uploading}
                      onClick={() => {
                        setFileName(null)
                        setFileId(undefined)
                      }}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="syllabus"
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50",
                      uploading && "pointer-events-none opacity-60",
                    )}
                  >
                    {uploading ? (
                      <>
                        <Spinner className="size-5" />
                        <span>Uploading PDF…</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="size-5" />
                        <span>Tap to attach a syllabus PDF</span>
                      </>
                    )}
                    <input
                      id="syllabus"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      disabled={uploading}
                      onChange={handleFile}
                    />
                  </label>
                )}
              </Field>

              {phase === "describe" && (
                <Button
                  type="submit"
                  size="lg"
                  disabled={description.trim().length < 15}
                >
                  <Sparkles data-icon="inline-start" />
                  Continue
                </Button>
              )}

              {phase === "analyzing" && (
                <Button type="button" size="lg" disabled>
                  <Spinner data-icon="inline-start" />
                  Analyzing your exam goals…
                </Button>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {phase === "analyzing" && clarifying.length === 0 && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <AnalyzeProgress status={analyzeStatus} questionCount={0} />
          </motion.div>
        )}

        {phase === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <GenerateProgress
              status={generateStatus}
              exam={generateMeta.exam}
              examCode={generateMeta.examCode}
              focusTopics={generateMeta.focusTopics}
              previews={questionPreviews}
              completedCount={completedQuestions}
              total={questionCount}
            />
          </motion.div>
        )}

        {(phase === "clarify" || (phase === "analyzing" && clarifying.length > 0)) &&
          clarifying.length > 0 && (
          <motion.div
            key="clarify"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <ClarifyingQuestions
              questions={clarifying}
              onAnswersChange={setClarificationAnswers}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "clarify" || phase === "generating") && (
        <div className="flex flex-col gap-3">
          {phase === "clarify" && (
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                <p className="text-sm font-medium">Session size</p>
                <div className="flex flex-wrap gap-2">
                  {SESSION_SIZE_PRESETS.map((n) => (
                    <SessionSizeChip
                      key={n}
                      active={questionCount === n}
                      disabled={n > maxQuestions}
                      onClick={() => setQuestionCount(n)}
                    >
                      {n} questions
                    </SessionSizeChip>
                  ))}
                </div>
                {!isPro && maxQuestions < 20 && (
                  <p className="text-xs text-muted-foreground">
                    Limited to {maxQuestions} based on your remaining daily quota.
                  </p>
                )}
                {selectedPreset && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <Label htmlFor="adaptive" className="text-sm font-medium">
                        Smart session
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Weight questions toward your weakest domains
                      </p>
                    </div>
                    <Switch
                      id="adaptive"
                      checked={adaptiveEnabled}
                      onCheckedChange={setAdaptiveEnabled}
                      disabled={!topicMastery.length}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
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
                    checked={timedPractice}
                    onCheckedChange={setTimedPractice}
                  />
                </div>
                {timedPractice && (
                  <div className="flex flex-wrap gap-2">
                    {[10, 15, 20, 30].map((m) => (
                      <SessionSizeChip
                        key={m}
                        active={practiceMinutes === m}
                        onClick={() => setPracticeMinutes(m)}
                      >
                        {m} min
                      </SessionSizeChip>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {phase === "clarify" && (
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isClarifyStreaming || questionCount > maxQuestions}
            >
              {isClarifyStreaming ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {isClarifyStreaming ? "Loading questions…" : "Generate & start session"}
            </Button>
          )}
          {phase === "clarify" && clarifying.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Your description looks clear — ready to generate questions.
            </p>
          )}
          <p className="text-center text-xs text-muted-foreground">
            {remaining === Infinity
              ? "Pro plan — unlimited questions"
              : `${remaining} free questions remaining today`}
          </p>
        </div>
      )}
    </div>
  )
}
