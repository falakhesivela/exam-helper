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
import { listExamPresetsByProvider } from "@/lib/exams"
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
  const [selected, setSelected] = useState<SelectedExam[]>([])
  const [customName, setCustomName] = useState("")
  const [syllabusName, setSyllabusName] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [examDate, setExamDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Already onboarded (revisit or skip replay): straight to the app.
  useEffect(() => {
    if (hydrated && profile.onboardedAt) router.replace("/dashboard")
  }, [hydrated, profile.onboardedAt, router])

  const providerGroups = useMemo(() => listExamPresetsByProvider(), [])
  const customSelected = selected.some((s) => s.examCode === "CUSTOM")
  const first = selected[0]

  function toggleExam(examCode: string, exam: string) {
    setSelected((prev) =>
      prev.some((s) => s.examCode === examCode)
        ? prev.filter((s) => s.examCode !== examCode)
        : [...prev, { examCode, exam }],
    )
  }

  async function handleSyllabus(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      // Scoped to CUSTOM so it grounds this exam's questions and lessons.
      await api.uploadPdf(file, "CUSTOM")
      setSyllabusName(file.name)
      toast.success(`Syllabus attached — we'll build questions from it`)
    } catch (err) {
      setSyllabusName(null)
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function finish(skipped: boolean) {
    if (submitting) return
    setSubmitting(true)
    try {
      await api.completeOnboarding(
        skipped
          ? { exams: [], skipped: true }
          : {
              exams: selected.map((s, i) => ({
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
                  setSelected((prev) => {
                    const rest = prev.filter((s) => s.examCode !== "CUSTOM")
                    return name.trim()
                      ? [...rest, { examCode: "CUSTOM", exam: name.trim() }]
                      : rest
                  })
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => void handleSyllabus(e.target.files?.[0])}
                  />
                  {syllabusName ? (
                    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                      <FileText className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0 truncate">{syllabusName}</span>
                      <button
                        type="button"
                        onClick={() => setSyllabusName(null)}
                        aria-label="Remove syllabus"
                        className="ml-auto text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <FileText data-icon="inline-start" />
                      )}
                      {uploading ? "Reading PDF…" : "Attach syllabus (PDF)"}
                    </Button>
                  )}
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
            {selected.map((s, i) => (
              <div key={s.examCode} className="flex items-center gap-3 text-sm">
                <Check className="size-4 shrink-0 text-success" />
                <span className="font-medium">{s.examCode === "CUSTOM" ? s.exam : s.examCode}</span>
                <span className="truncate text-muted-foreground">
                  {s.examCode === "CUSTOM" ? "Custom exam" : s.exam}
                </span>
                {i === 0 && examDate && (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {examDate}
                  </span>
                )}
              </div>
            ))}
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
          <Button onClick={() => setStep("date")} disabled={selected.length === 0}>
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
          <Button onClick={() => void finish(false)} disabled={submitting} size="lg">
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
