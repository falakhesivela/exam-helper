"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarDays, Check, FileText, GraduationCap, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { useRef } from "react"
import {
  customExamCode,
  getExamBlueprint,
  listExamPresetsByProvider,
} from "@/lib/exams"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

const PROVIDER_LABELS: Record<string, string> = {
  aws: "AWS",
  azure: "Microsoft Azure",
  gcp: "Google Cloud",
  comptia: "CompTIA",
  cisco: "Cisco",
  isc2: "ISC2",
}

type Step = "exams" | "date" | "done"

interface SelectedExam {
  examCode: string
  exam: string
}

interface AttachedSyllabus {
  id: string
  name: string
}

/**
 * Attach/remove a syllabus PDF for one exam. Each instance owns its file input
 * so the CUSTOM field and the done-step row can't clobber each other's picker.
 */
function SyllabusAttach({
  attached,
  uploading,
  onFile,
  onRemove,
}: {
  attached: AttachedSyllabus | undefined
  uploading: boolean
  onFile: (file: File | undefined) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  if (attached) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
        <FileText className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 truncate">{attached.name}</span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove syllabus"
          className="ml-auto text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <FileText data-icon="inline-start" />
        )}
        {uploading ? "Reading PDF…" : "Attach syllabus (PDF)"}
      </Button>
    </>
  )
}

/**
 * Post-signup setup: pick the exam(s) you're studying and (optionally) an
 * exam date. Zero AI calls — everything renders from static preset data.
 */
export function OnboardingWizard() {
  const router = useRouter()
  const profile = useSessionStore((s) => s.profile)
  const hydrated = useSessionStore((s) => s.hydrated)
  const refreshProfile = useSessionStore((s) => s.refreshProfile)
  const refreshUserExams = useSessionStore((s) => s.refreshUserExams)
  const setActiveExam = useSessionStore((s) => s.setActiveExam)

  const [step, setStep] = useState<Step>("exams")
  /** Presets only — the custom exam is derived from customName. */
  const [selected, setSelected] = useState<SelectedExam[]>([])
  const [customName, setCustomName] = useState("")
  /** Set once a syllabus is attached, pinning the custom exam's code. */
  const [frozenCustomCode, setFrozenCustomCode] = useState<string | null>(null)
  /** Attached syllabi, keyed by the exam code they ground. */
  const [syllabi, setSyllabi] = useState<Record<string, AttachedSyllabus>>({})
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [examDate, setExamDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Already onboarded (revisit or skip replay): straight to the app.
  useEffect(() => {
    if (hydrated && profile.onboardedAt) router.replace("/dashboard")
  }, [hydrated, profile.onboardedAt, router])

  const providerGroups = useMemo(() => listExamPresetsByProvider(), [])
  const customSelected = customName.trim().length > 0
  /**
   * A custom exam's code is minted from its name, so it moves while the user
   * types. Attaching a syllabus scopes an upload to the code server-side, so
   * the first attach freezes it — the name stays editable, the key doesn't.
   */
  const customCode = frozenCustomCode ?? customExamCode(customName)

  // Presets are chosen by tapping; the custom exam exists whenever it's named.
  const selectedExams = useMemo<SelectedExam[]>(
    () =>
      customSelected
        ? [...selected, { examCode: customCode, exam: customName.trim() }]
        : selected,
    [selected, customSelected, customCode, customName],
  )
  const first = selectedExams[0]

  function toggleExam(examCode: string, exam: string) {
    setSelected((prev) =>
      prev.some((s) => s.examCode === examCode)
        ? prev.filter((s) => s.examCode !== examCode)
        : [...prev, { examCode, exam }],
    )
  }

  async function handleSyllabus(examCode: string, file: File | undefined) {
    if (!file) return
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("PDF must be 5 MB or smaller")
      return
    }
    setUploadingFor(examCode)
    try {
      // Scoped to the exam it belongs to, so the backend grounds only that
      // exam's questions and lessons in it.
      const { fileId } = await api.uploadPdf(file, examCode)
      setSyllabi((prev) => ({
        ...prev,
        [examCode]: { id: fileId, name: file.name },
      }))
      toast.success("Syllabus attached — we'll build questions and lessons from it")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingFor(null)
    }
  }

  /** Drops the stored upload too, so a de-selected exam leaves nothing behind. */
  function removeSyllabus(examCode: string) {
    const attached = syllabi[examCode]
    if (!attached) return
    setSyllabi((prev) => {
      const next = { ...prev }
      delete next[examCode]
      return next
    })
    void api.deleteUpload(attached.id).catch(() => {
      // Best-effort: the row is orphaned at worst, never shown to the user.
    })
  }

  async function finish(skipped: boolean) {
    if (submitting) return
    setSubmitting(true)
    try {
      await api.completeOnboarding(
        skipped
          ? { exams: [], skipped: true }
          : {
              exams: selectedExams.map((s, i) => ({
                examCode: s.examCode,
                exam: s.exam,
                // The date applies to the first-selected (main) exam.
                ...(i === 0 && examDate ? { examDate } : {}),
              })),
            },
      )
      await Promise.all([refreshProfile(), refreshUserExams()])
      if (!skipped && first) {
        await setActiveExam(first.examCode)
        router.replace("/learn")
      } else {
        router.replace("/dashboard")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your setup")
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === "exams" && "What are you studying for?"}
            {step === "date" && "When is your exam?"}
            {step === "done" && "You're all set"}
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            {step === "exams" &&
              "Pick one or more certifications — this personalizes your syllabus, practice, and study plan."}
            {step === "date" &&
              "Optional — we'll use it to pace your study plan. You can set or change it anytime."}
            {step === "done" &&
              "Your syllabus is ready. Start with a lesson or jump into practice."}
          </p>
        </div>
        {step !== "done" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void finish(true)}
            disabled={submitting}
            className="shrink-0 text-muted-foreground"
          >
            Skip for now
          </Button>
        )}
      </header>

      {step === "exams" && (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            {providerGroups.map(({ provider, presets }) => (
              <div key={provider} className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {PROVIDER_LABELS[provider] ?? provider}
                </p>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => {
                    const isSelected = selected.some((s) => s.examCode === p.examCode)
                    return (
                      <button
                        key={p.examCode}
                        type="button"
                        onClick={() => toggleExam(p.examCode, p.exam)}
                        aria-pressed={isSelected}
                        title={p.exam}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                          isSelected
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-border text-foreground/80 hover:border-primary/40",
                        )}
                      >
                        {isSelected && <Check className="size-3.5" />}
                        {p.examCode}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Something else
              </p>
              <input
                value={customName}
                onChange={(e) => {
                  const name = e.target.value
                  setCustomName(name)
                  // Clearing the name drops the exam — take its syllabus with it.
                  if (!name.trim() && frozenCustomCode) {
                    removeSyllabus(frozenCustomCode)
                    setFrozenCustomCode(null)
                  }
                }}
                placeholder="e.g. Kubernetes CKA, Salesforce Admin…"
                aria-label="Custom certification name"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {customSelected && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Attach the official syllabus or your study notes (PDF) and
                    we&apos;ll build questions and lessons directly from them.
                  </p>
                  <SyllabusAttach
                    attached={syllabi[customCode]}
                    uploading={uploadingFor === customCode}
                    onFile={(file) => {
                      setFrozenCustomCode(customCode)
                      void handleSyllabus(customCode, file)
                    }}
                    onRemove={() => {
                      removeSyllabus(customCode)
                      setFrozenCustomCode(null)
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "date" && (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <GraduationCap className="size-4 text-primary" />
              {first?.exam}
            </div>
            <label className="flex flex-col gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="size-4" />
                Exam date (optional)
              </span>
              <input
                type="date"
                value={examDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-fit rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <button
              type="button"
              onClick={() => setExamDate("")}
              className={cn(
                "w-fit text-xs text-muted-foreground hover:text-foreground",
                !examDate && "invisible",
              )}
            >
              Clear — not sure yet
            </button>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5">
            {selectedExams.map((s, i) => {
              const isPreset = getExamBlueprint(s.examCode) !== undefined
              return (
                <div key={s.examCode} className="flex items-center gap-3 text-sm">
                  <Check className="size-4 shrink-0 text-success" />
                  <span className="font-medium">
                    {isPreset ? s.examCode : s.exam}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {isPreset ? s.exam : "Custom exam"}
                  </span>
                  {i === 0 && examDate && (
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {examDate}
                    </span>
                  )}
                </div>
              )
            })}

            {/* Optional and never a gate: presets already have a blueprint, so a
                syllabus only sharpens them. Custom exams attach on the exams step. */}
            {first && getExamBlueprint(first.examCode) !== undefined && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground text-pretty">
                  Have the official {first.examCode} syllabus or your own study
                  notes? Attach the PDF to ground your questions and lessons in it
                  {selectedExams.length > 1 ? " — you can add one per exam later in Profile." : " — optional, and you can add it later in Profile."}
                </p>
                <SyllabusAttach
                  attached={syllabi[first.examCode]}
                  uploading={uploadingFor === first.examCode}
                  onFile={(file) => void handleSyllabus(first.examCode, file)}
                  onRemove={() => removeSyllabus(first.examCode)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        {step !== "exams" ? (
          <Button
            variant="ghost"
            onClick={() => setStep(step === "done" ? "date" : "exams")}
            disabled={submitting}
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
        ) : (
          <span />
        )}

        {step === "exams" && (
          <Button
            onClick={() => setStep("date")}
            disabled={selectedExams.length === 0}
          >
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
        {step === "date" && (
          <Button onClick={() => setStep("done")}>
            Continue
            <ArrowRight data-icon="inline-end" />
          </Button>
        )}
        {step === "done" && (
          <Button
            onClick={() => void finish(false)}
            disabled={submitting || uploadingFor !== null}
            size="lg"
          >
            {submitting ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Sparkles data-icon="inline-start" />
            )}
            {submitting ? "Setting up…" : "Start learning"}
          </Button>
        )}
      </div>
    </div>
  )
}
