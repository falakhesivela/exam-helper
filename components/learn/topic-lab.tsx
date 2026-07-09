"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FlaskConical,
  ListChecks,
  Play,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { LessonCheck } from "@/components/learn/lesson-check"
import { api, ApiClientError } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { LabContent, TopicLab } from "@/types"
import { cn } from "@/lib/utils"

interface TopicLabViewProps {
  topicSlug: string
}

function LabStepRow({
  index,
  step,
  done,
  onToggle,
}: {
  index: number
  step: LabContent["steps"][number]
  done: boolean
  onToggle: () => void
}) {
  const [showHint, setShowHint] = useState(false)
  return (
    <li className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={done}
          aria-label={`Mark step ${index + 1} ${done ? "not done" : "done"}`}
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
            done
              ? "border-success bg-success text-white"
              : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          {done ? <CheckCircle2 className="size-4" /> : index + 1}
        </button>
        <div className="flex min-w-0 flex-col gap-1">
          <p className={cn("text-sm font-medium", done && "text-muted-foreground line-through")}>
            {step.title}
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {step.instruction}
          </p>
          {step.hint && (
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="flex w-fit items-center gap-1 text-xs text-primary hover:underline"
            >
              <ChevronDown className={cn("size-3 transition-transform", showHint && "rotate-180")} />
              Hint
            </button>
          )}
          {step.hint && showHint && (
            <p className="text-xs leading-relaxed text-muted-foreground">{step.hint}</p>
          )}
        </div>
      </div>
    </li>
  )
}

/** Guided hands-on lab: preview → start (tier-gated) → step checklist → checkpoints. */
export function TopicLabView({ topicSlug }: TopicLabViewProps) {
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const [lab, setLab] = useState<TopicLab | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [streaming, setStreaming] = useState<Partial<LabContent> | null>(null)
  const [starting, setStarting] = useState(false)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLab(await api.getLab(topicSlug, activeExamCode))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load lab")
    } finally {
      setLoading(false)
    }
  }, [topicSlug, activeExamCode])

  useEffect(() => {
    void load()
  }, [load])

  async function handleGenerate() {
    setGenerating(true)
    setStreaming(null)
    try {
      const data = await api.generateLab(topicSlug, {
        exam: activeExamCode,
        onDelta: setStreaming,
      })
      setLab(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate lab")
    } finally {
      setGenerating(false)
      setStreaming(null)
    }
  }

  async function handleStart() {
    setStarting(true)
    try {
      setLab(await api.startLab(topicSlug, activeExamCode))
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "QUOTA_LIMIT") {
        toast.error("Free plan includes 1 hands-on lab. Upgrade for unlimited labs.")
      } else {
        toast.error(err instanceof Error ? err.message : "Could not start lab")
      }
    } finally {
      setStarting(false)
    }
  }

  function toggleStep(index: number) {
    if (!lab) return
    const next = lab.stepsDone.includes(index)
      ? lab.stepsDone.filter((i) => i !== index)
      : [...lab.stepsDone, index].sort((a, b) => a - b)
    setLab({ ...lab, stepsDone: next })
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void api
        .updateLabProgress(topicSlug, { stepsDone: next }, activeExamCode)
        .catch(() => {})
    }, 600)
  }

  async function handleCheckpointSubmit(score: number, total: number) {
    setSaving(true)
    try {
      const updated = await api.updateLabProgress(
        topicSlug,
        { checkpointScore: score, checkpointTotal: total },
        activeExamCode,
      )
      setLab(updated)
      if (updated.status === "completed") {
        toast.success("Lab complete — nice work! Don't skip the cleanup below.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your result")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen message="Loading lab…" className="min-h-[50vh]" />
  }
  if (!lab) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        This lab isn&apos;t available.
      </p>
    )
  }

  const content = lab.content
  const preview = lab.preview
  const remainingLabs =
    lab.labLimit === null ? Infinity : Math.max(0, lab.labLimit - lab.labsUsed)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        href={`/learn/${topicSlug}`}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to lesson
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{lab.examCode}</Badge>
          <Badge variant="outline" className="gap-1">
            <FlaskConical className="size-3" />
            Hands-on lab
          </Badge>
          {lab.status === "completed" && (
            <Badge className="bg-success text-white">Completed</Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {content?.title ?? preview?.title ?? lab.topicName}
        </h1>
        {(content?.estimatedMinutes ?? preview?.estimatedMinutes) && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />~
            {content?.estimatedMinutes ?? preview?.estimatedMinutes} minutes · in
            your own {lab.examCode.startsWith("AZ") ? "Azure" : lab.examCode === "GCP-ACE" ? "Google Cloud" : "AWS"} account
          </p>
        )}
      </header>

      {/* State 1: not generated yet */}
      {!content && !preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Build this lab</CardTitle>
            <CardDescription>
              A step-by-step exercise you run in your own free-tier account —
              generated once and shared with everyone studying this topic.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {generating && (
              <div className="flex flex-col gap-2">
                {(streaming?.steps ?? [])
                  .filter((s) => s?.title)
                  .map((s, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {i + 1}. {s.title}
                    </p>
                  ))}
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}
            <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-fit">
              {generating ? <Spinner data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
              {generating ? "Building lab…" : "Generate lab"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* State 2: preview — generated but not started */}
      {!content && preview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Why this lab</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
              <p>{preview.scenario}</p>
              <p className="text-xs text-muted-foreground">
                {preview.stepsCount} steps · {preview.checkpointCount} checkpoints
              </p>
              {(preview.prerequisites ?? []).length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {(preview.prerequisites ?? []).map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <ListChecks className="mt-0.5 size-4 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {preview.costWarning && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="flex items-start gap-2.5 py-4 text-sm leading-relaxed">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                {preview.costWarning}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={handleStart} disabled={starting || remainingLabs <= 0}>
              {starting ? <Spinner data-icon="inline-start" /> : <Play data-icon="inline-start" />}
              {starting ? "Starting…" : "Start lab"}
            </Button>
            {lab.labLimit !== null && (
              <p className="text-center text-xs text-muted-foreground">
                {remainingLabs > 0
                  ? `${remainingLabs} of ${lab.labLimit} labs remaining on your plan`
                  : "Lab limit reached — upgrade for unlimited hands-on labs"}
              </p>
            )}
            {remainingLabs <= 0 && (
              <Button variant="outline" asChild>
                <Link href="/upgrade">View plans</Link>
              </Button>
            )}
          </div>
        </>
      )}

      {/* State 3: started — the full lab */}
      {content && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {lab.stepsDone.length} of {content.steps.length} steps done
                </span>
              </div>
              <Progress
                value={(lab.stepsDone.length / Math.max(1, content.steps.length)) * 100}
                className="h-1.5"
              />
            </CardContent>
          </Card>

          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-start gap-2.5 py-4 text-sm leading-relaxed">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              {content.costWarning}
            </CardContent>
          </Card>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Steps</h2>
            <ol className="flex flex-col gap-2">
              {content.steps.map((step, i) => (
                <LabStepRow
                  key={i}
                  index={i}
                  step={step}
                  done={lab.stepsDone.includes(i)}
                  onToggle={() => toggleStep(i)}
                />
              ))}
            </ol>
          </section>

          {content.checkpoints.length > 0 && (
            <LessonCheck
              questions={content.checkpoints}
              savedScore={lab.checkpointScore}
              savedTotal={lab.checkpointTotal}
              onSubmit={handleCheckpointSubmit}
              submitting={saving}
            />
          )}

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-destructive" />
                Don&apos;t get billed — clean up
              </CardTitle>
              <CardDescription>
                Do this even if you didn&apos;t finish the lab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {content.cleanup.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {content.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">References</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {content.references.map((ref) => (
                  <a
                    key={ref.url}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="size-3.5" />
                    {ref.label}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Labs run in your own cloud account — you are responsible for any
            resources you create.
          </p>
        </>
      )}
    </div>
  )
}
