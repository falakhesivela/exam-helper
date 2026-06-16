"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AnimatePresence, motion } from "motion/react"
import { FileText, Loader2, Sparkles, UploadCloud, Wand2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSessionStore } from "@/lib/store/use-session-store"
import { mockClarifyingQuestions } from "@/lib/mock-data"
import { toast } from "sonner"
import { ClarifyingQuestions } from "@/components/intake/clarifying-questions"

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

type Phase = "describe" | "clarify" | "generating"

export function IntakeForm() {
  const router = useRouter()
  const startSession = useSessionStore((s) => s.startSession)
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())

  const [phase, setPhase] = useState<Phase>("describe")
  const [fileName, setFileName] = useState<string | null>(null)

  const form = useForm<IntakeValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: { description: "" },
  })

  const description = form.watch("description")

  function onSubmitDescription(values: IntakeValues) {
    // Simulate the AI deciding it needs clarification.
    void values
    setPhase("clarify")
  }

  function handleGenerate() {
    setPhase("generating")
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

    // Simulate generation latency, then route into the quiz.
    setTimeout(() => {
      const id = startSession(exam, examCode, focus)
      toast.success("Your practice session is ready")
      router.push(`/quiz/${id}`)
    }, 1600)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      toast.success(`Attached ${file.name}`)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            Describe your exam
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
                  disabled={phase === "generating"}
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
                    className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Optional syllabus upload */}
              <Field>
                <FieldLabel htmlFor="syllabus">Syllabus PDF (optional)</FieldLabel>
                {fileName ? (
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <FileText className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{fileName}</span>
                    </span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      onClick={() => setFileName(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="syllabus"
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50"
                  >
                    <UploadCloud className="size-5" />
                    <span>Tap to attach a syllabus PDF</span>
                    <input
                      id="syllabus"
                      type="file"
                      accept="application/pdf"
                      className="sr-only"
                      onChange={handleFile}
                    />
                  </label>
                )}
              </Field>

              {phase === "describe" && (
                <Button type="submit" size="lg" disabled={description.trim().length < 15}>
                  <Sparkles data-icon="inline-start" />
                  Continue
                </Button>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {(phase === "clarify" || phase === "generating") && (
          <motion.div
            key="clarify"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <ClarifyingQuestions questions={mockClarifyingQuestions} />
          </motion.div>
        )}
      </AnimatePresence>

      {(phase === "clarify" || phase === "generating") && (
        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={handleGenerate} disabled={phase === "generating"}>
            {phase === "generating" ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Generating your questions…
              </>
            ) : (
              <>
                <Sparkles data-icon="inline-start" />
                Generate & start session
              </>
            )}
          </Button>
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
