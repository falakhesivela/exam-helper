"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlarmClock,
  FileText,
  ListChecks,
  Search,
  Sparkles,
  Timer,
  UploadCloud,
  X,
  Zap,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useSessionStore } from "@/lib/store/use-session-store"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { ApiClientError, api } from "@/lib/api/client"
import {
  getExamBlueprint,
  listExamPresets,
  listExamPresetsByProvider,
  resolveExamBlueprint,
  scaledExamParams,
  type ExamBlueprint,
} from "@/lib/exams"
import { cn } from "@/lib/utils"

const CUSTOM_EXAM_CODE = "__custom"

const QUESTION_PRESETS = [10, 20, 30, 65, 90, 100, 125]
const TIME_PRESETS = [15, 30, 60, 90, 120, 130, 180]

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
        "inline-flex h-control items-center rounded-md border px-3.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function providerLabel(provider: ExamBlueprint["provider"]): string {
  const labels: Record<ExamBlueprint["provider"], string> = {
    aws: "AWS",
    azure: "Azure",
    gcp: "Google Cloud",
    comptia: "CompTIA",
    cisco: "Cisco",
    isc2: "ISC2",
    custom: "Custom",
  }
  return labels[provider]
}

function applyBlueprintDefaults(blueprint: ExamBlueprint) {
  return {
    questionCount: blueprint.questionCount,
    durationMin: blueprint.durationMin,
  }
}

export function ExamConfig() {
  const router = useRouter()
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const maxExamLength = useSessionStore((s) => s.profile.limits.maxExamLength)
  const hydrate = useSessionStore((s) => s.hydrate)
  // Largest exam launchable right now: question quota ∩ per-exam plan cap.
  const examCap = Math.min(remaining, maxExamLength)

  const presets = useMemo(() => listExamPresets(), [])
  const presetGroups = useMemo(() => listExamPresetsByProvider(), [])

  const [selectedCode, setSelectedCode] = useState(presets[0].examCode)
  const [count, setCount] = useState(presets[0].questionCount)
  const [minutes, setMinutes] = useState(presets[0].durationMin)
  const [starting, setStarting] = useState(false)
  const [customExam, setCustomExam] = useState("")
  const [customCode, setCustomCode] = useState("")
  const [customDescription, setCustomDescription] = useState("")
  const [customFocusTopics, setCustomFocusTopics] = useState("")
  const [presetSearch, setPresetSearch] = useState("")
  const [fileId, setFileId] = useState<string | undefined>()
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const isCustomExam = selectedCode === CUSTOM_EXAM_CODE
  const selectedBlueprint = isCustomExam
    ? null
    : getExamBlueprint(selectedCode)

  const customBlueprint = useMemo(() => {
    if (!isCustomExam || customExam.trim().length < 3) return null
    return resolveExamBlueprint(customExam, customCode || "CUSTOM", {
      focusTopicsText: customFocusTopics,
      description: customDescription,
      questionCount: count,
      durationMin: minutes,
    })
  }, [
    isCustomExam,
    customExam,
    customCode,
    customFocusTopics,
    customDescription,
    count,
    minutes,
  ])

  const matchedPresetFromCustomCode =
    isCustomExam && customCode.trim()
      ? getExamBlueprint(customCode.trim())
      : null

  const activeBlueprint = selectedBlueprint ?? customBlueprint
  const activeExam = isCustomExam
    ? {
        exam: (matchedPresetFromCustomCode?.exam ?? customExam).trim(),
        examCode:
          matchedPresetFromCustomCode?.examCode ??
          (customCode.trim() || "CUSTOM"),
      }
    : {
        exam: selectedBlueprint!.exam,
        examCode: selectedBlueprint!.examCode,
      }
  const validExam = !isCustomExam || customExam.trim().length >= 3

  const filteredGroups = useMemo(() => {
    const q = presetSearch.trim().toLowerCase()
    if (!q) return presetGroups
    return presetGroups
      .map((group) => ({
        ...group,
        presets: group.presets.filter(
          (preset) =>
            preset.examCode.toLowerCase().includes(q) ||
            preset.exam.toLowerCase().includes(q) ||
            providerLabel(group.provider).toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.presets.length > 0)
  }, [presetGroups, presetSearch])

  const perQuestion = count > 0 ? Math.round((minutes * 60) / count) : 0
  const tightPace = perQuestion > 0 && perQuestion < 30
  const validCount = count >= 1 && count <= 100
  const validMinutes = minutes >= 1 && minutes <= 240

  /** Cap at the plan's launchable size with proportional time. */
  const effectiveLaunch = useMemo(() => {
    const capped = Math.min(count, examCap)
    if (capped === count) return { questionCount: count, durationMin: minutes }
    if (selectedBlueprint) {
      return scaledExamParams(selectedBlueprint, capped)
    }
    return {
      questionCount: capped,
      durationMin: Math.max(
        5,
        Math.round(minutes * (capped / Math.max(count, 1))),
      ),
    }
  }, [count, minutes, examCap, selectedBlueprint])

  function selectPreset(code: string) {
    setSelectedCode(code)
    const blueprint = getExamBlueprint(code)
    if (blueprint) {
      const defaults = applyBlueprintDefaults(blueprint)
      if (defaults.questionCount <= examCap) {
        setCount(defaults.questionCount)
        setMinutes(defaults.durationMin)
      } else {
        const scaled = scaledExamParams(
          blueprint,
          Math.min(defaults.questionCount, examCap),
        )
        setCount(scaled.questionCount)
        setMinutes(scaled.durationMin)
      }
    }
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }
    setUploading(true)
    setFileName(file.name)
    try {
      const { fileId: id } = await api.uploadPdf(file)
      setFileId(id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
      setFileName(null)
      setFileId(undefined)
    } finally {
      setUploading(false)
    }
  }

  async function launch(questionCount: number, durationMin: number) {
    if (starting) return
    if (!validExam) {
      toast.error("Tell us which exam you want to practice")
      return
    }
    if (questionCount > examCap) {
      toast.error(
        remaining < maxExamLength
          ? `Only ${remaining} questions left on your plan`
          : `Your plan caps exams at ${maxExamLength} questions`,
      )
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
          ...(isCustomExam && {
            description: customDescription.trim() || undefined,
            focusTopicsText: customFocusTopics.trim() || undefined,
            fileId,
          }),
        },
        {
          onReady: (session) => {
            toast.success("First question ready — you can start the exam")
            router.push(`/exam/${session.id}`)
            setStarting(false)
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
            setStarting(false)
          },
        },
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start exam")
      setStarting(false)
    }
  }

  const realisticDefaults = activeBlueprint
    ? applyBlueprintDefaults(activeBlueprint)
    : null

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            Which exam?
          </CardTitle>
          <CardDescription>
            Pick a certification preset or describe your own exam.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="preset-search">Search presets</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="preset-search"
                placeholder="Filter by code, name, or provider…"
                value={presetSearch}
                onChange={(e) => setPresetSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </Field>

          <div className="flex flex-col gap-4">
            {filteredGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No presets match your search. Try Custom or clear the filter.
              </p>
            ) : (
              filteredGroups.map((group) => (
              <div key={group.provider} className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {providerLabel(group.provider)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {group.presets.map((preset) => (
                    <PresetChip
                      key={preset.examCode}
                      active={selectedCode === preset.examCode}
                      onClick={() => selectPreset(preset.examCode)}
                    >
                      {preset.examCode}
                    </PresetChip>
                  ))}
                </div>
              </div>
            ))
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <PresetChip
                active={isCustomExam}
                onClick={() => setSelectedCode(CUSTOM_EXAM_CODE)}
              >
                Custom…
              </PresetChip>
            </div>
          </div>

          {isCustomExam ? (
            <div className="flex flex-col gap-4">
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
                  <FieldLabel htmlFor="custom-exam-code">Code (optional)</FieldLabel>
                  <Input
                    id="custom-exam-code"
                    placeholder="e.g. SAA-C03 or TA-003"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                  />
                </Field>
              </div>
              {matchedPresetFromCustomCode && (
                <p className="text-xs text-primary">
                  Recognized preset {matchedPresetFromCustomCode.examCode} — full
                  blueprint will be used.
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="custom-exam-context">
                  Exam context (optional)
                </FieldLabel>
                <Textarea
                  id="custom-exam-context"
                  rows={3}
                  placeholder="Weak areas, job role, timeline, or syllabus notes…"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="custom-focus-topics">
                  Domains / topics (optional)
                </FieldLabel>
                <Textarea
                  id="custom-focus-topics"
                  rows={2}
                  placeholder="One per line or comma-separated, e.g. Networking, Security, IAM"
                  value={customFocusTopics}
                  onChange={(e) => setCustomFocusTopics(e.target.value)}
                />
                <FieldDescription>
                  Used to weight questions across domains. Leave blank for a
                  sensible default split.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="custom-syllabus">Syllabus PDF (optional)</FieldLabel>
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
                    htmlFor="custom-syllabus"
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50",
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
                        <span>Attach syllabus for AI grounding</span>
                      </>
                    )}
                    <input
                      id="custom-syllabus"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      disabled={uploading}
                      onChange={handleFile}
                    />
                  </label>
                )}
              </Field>
              {customBlueprint && !matchedPresetFromCustomCode && (
                <p className="text-xs text-muted-foreground">
                  Domain-weighted exam across {customBlueprint.domains.length}{" "}
                  areas:{" "}
                  {customBlueprint.domains.map((d) => d.name).join(", ")}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <FieldDescription>{selectedBlueprint!.exam}</FieldDescription>
              <p className="text-xs text-muted-foreground">
                {providerLabel(selectedBlueprint!.provider)} · pass{" "}
                {selectedBlueprint!.passMark}% ·{" "}
                {selectedBlueprint!.domains.length} domains
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {activeBlueprint && (
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
                {isCustomExam ? "Start custom mock exam" : "Start realistic mock exam"}
              </h2>
              <p className="max-w-md text-sm text-muted-foreground">
                {realisticDefaults && realisticDefaults.questionCount <= examCap
                  ? `${realisticDefaults.questionCount} questions · ${realisticDefaults.durationMin} min · domain-weighted AI generation`
                  : `${effectiveLaunch.questionCount} questions · ${effectiveLaunch.durationMin} min (scaled to your plan limit)`}
              </p>
            </div>
            <Button
              size="lg"
              className="shrink-0"
              disabled={starting || !validExam}
              onClick={() =>
                launch(
                  realisticDefaults && realisticDefaults.questionCount <= examCap
                    ? realisticDefaults.questionCount
                    : effectiveLaunch.questionCount,
                  realisticDefaults && realisticDefaults.questionCount <= examCap
                    ? realisticDefaults.durationMin
                    : effectiveLaunch.durationMin,
                )
              }
            >
              {starting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Starting…
                </>
              ) : (
                <>
                  <Zap data-icon="inline-start" />
                  Start mock exam
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlarmClock className="size-4 text-primary" />
            Customize your exam
          </CardTitle>
          <CardDescription>
            Adjust length and time. The clock auto-submits when time runs out.
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
                <PresetChip key={n} active={count === n} onClick={() => setCount(n)}>
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

          {realisticDefaults && activeBlueprint && (
            <button
              type="button"
              onClick={() => {
                setCount(realisticDefaults.questionCount)
                setMinutes(realisticDefaults.durationMin)
              }}
              className="self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Match the real {activeBlueprint.examCode} (
              {realisticDefaults.questionCount} questions ·{" "}
              {realisticDefaults.durationMin} min)
            </button>
          )}

          <Button
            size="lg"
            disabled={
              starting ||
              !validCount ||
              !validMinutes ||
              !validExam ||
              count > examCap
            }
            onClick={() => launch(effectiveLaunch.questionCount, effectiveLaunch.durationMin)}
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

          {Number.isFinite(remaining) && (
            <p className="text-center text-xs text-muted-foreground">
              {remaining} questions remaining on your plan
              {count > examCap && (
                <span className="block text-destructive">
                  Reduce to {examCap} or fewer questions, or upgrade for
                  full-length exams.
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
