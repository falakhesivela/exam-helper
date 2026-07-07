"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Flame,
  Gauge,
  Leaf,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import type { PlanEffort } from "@/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSessionStore } from "@/lib/store/use-session-store"
import { isPaidTier } from "@/lib/config/tiers"
import { ApiClientError } from "@/lib/api/client"
import { addDays, todayIso, weekdayOf, WEEKDAY_LABELS } from "@/components/plan/task-meta"
import { EFFORT_QUESTION_BUDGET } from "@/lib/plan/schedule"
import { cn } from "@/lib/utils"

const STEPS = ["Exam date", "Study days", "Intensity"] as const

const EFFORT_OPTIONS: {
  value: PlanEffort
  label: string
  blurb: string
  icon: typeof Leaf
}[] = [
  { value: "light", label: "Light", blurb: "Short daily sessions", icon: Leaf },
  { value: "standard", label: "Standard", blurb: "The balanced default", icon: Gauge },
  { value: "intense", label: "Intense", blurb: "Fast-track cramming", icon: Flame },
]

function friendlyCreateError(err: unknown): { message: string; toPractice?: boolean } {
  if (err instanceof ApiClientError) {
    switch (err.code) {
      case "NO_EXAM":
      case "NO_DATA":
        return { message: err.message, toPractice: true }
      case "NOT_ENOUGH_DAYS":
        return { message: "That schedule has no study days. Pick a later date or free up a weekday." }
      case "INVALID_DATE":
        return { message: "Pick an exam date in the future." }
      default:
        return { message: err.message }
    }
  }
  return { message: "Couldn't build a plan. Try again." }
}

/** Shown when the user has no active plan — a 3-step wizard to generate one. */
export function PlanSetupWizard() {
  const createPlan = useSessionStore((s) => s.createPlan)
  const profile = useSessionStore((s) => s.profile)

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [targetDate, setTargetDate] = useState(() => addDays(todayIso(), 28))
  const [restDays, setRestDays] = useState<number[]>([])
  const [effort, setEffort] = useState<PlanEffort>("standard")
  const [creating, setCreating] = useState(false)

  const today = todayIso()
  const minDate = addDays(today, 1)
  const dateValid = targetDate > today

  // Study days between tomorrow and the exam given the current rest days.
  let studyDayCount = 0
  if (dateValid) {
    const rest = new Set(restDays)
    for (let d = today; d < targetDate; d = addDays(d, 1)) {
      if (!rest.has(weekdayOf(d))) studyDayCount++
    }
  }

  // Cap plan pacing at the tier's question allowance (null = unlimited).
  const dailyLimit =
    profile.limits.questions === null
      ? 30
      : Math.min(30, profile.limits.questions)
  const questionsPerDay = (e: PlanEffort) =>
    Math.max(1, Math.min(dailyLimit, EFFORT_QUESTION_BUDGET[e]))

  function go(delta: number) {
    setDirection(delta)
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + delta)))
  }

  function toggleRestDay(day: number) {
    setRestDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : prev.length >= 6
          ? prev // keep at least one study weekday
          : [...prev, day],
    )
  }

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      await createPlan({ targetDate, restDays, effort })
      toast.success("Your study plan is ready!")
    } catch (err) {
      const { message, toPractice } = friendlyCreateError(err)
      if (toPractice) {
        toast.error(message, {
          action: { label: "Practice", onClick: () => (window.location.href = "/practice") },
        })
      } else {
        toast.error(message)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-primary" />
          Build your study plan
        </CardTitle>
        <CardDescription>
          A day-by-day path to your pass mark that adapts when life gets in the
          way — three quick questions.
        </CardDescription>
        <div className="mt-2 flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-36 flex-col gap-4"
          >
            {step === 0 && (
              <>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  When is your exam?
                  <input
                    type="date"
                    value={targetDate}
                    min={minDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "In 2 weeks", days: 14 },
                    { label: "In 4 weeks", days: 28 },
                    { label: "In 8 weeks", days: 56 },
                  ].map((preset) => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setTargetDate(addDays(today, preset.days))}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors hover:border-primary hover:text-primary",
                        targetDate === addDays(today, preset.days) &&
                          "border-primary bg-primary/10 text-primary",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-sm font-medium">Which days can you study?</p>
                <div className="flex justify-between gap-1">
                  {WEEKDAY_LABELS.map((label, day) => {
                    const active = !restDays.includes(day)
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleRestDay(day)}
                        className={cn(
                          "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground",
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {studyDayCount > 0
                    ? `${studyDayCount} study day${studyDayCount === 1 ? "" : "s"} before your exam. Rest days stay task-free.`
                    : "That leaves no study days — free up a weekday or move the date."}
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm font-medium">How hard do you want to push?</p>
                <div className="flex flex-col gap-2">
                  {EFFORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const selected = effort === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setEffort(opt.value)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{opt.label}</span>
                          <span className="block text-xs text-muted-foreground">{opt.blurb}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ~{questionsPerDay(opt.value)} Q/day
                        </span>
                      </button>
                    )
                  })}
                </div>
                {!isPaidTier(profile.plan) && dailyLimit < EFFORT_QUESTION_BUDGET.intense && (
                  <p className="text-xs text-muted-foreground">
                    Free plan caps practice at {dailyLimit} questions/day.{" "}
                    <Link href="/upgrade" className="text-primary underline-offset-2 hover:underline">
                      Upgrade
                    </Link>{" "}
                    for the full intense pace.
                  </p>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => go(-1)}
            disabled={step === 0 || creating}
            className={cn(step === 0 && "invisible")}
          >
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => go(1)}
              disabled={(step === 0 && !dateValid) || (step === 1 && studyDayCount === 0)}
            >
              Next
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button size="sm" onClick={() => void handleCreate()} disabled={creating || studyDayCount === 0}>
              {creating ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Building your plan…
                </>
              ) : (
                <>
                  <Sparkles data-icon="inline-start" />
                  Generate plan
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Built from your recent practice and the exam blueprint. Miss a day and
          the plan quietly reshuffles — no guilt, no manual fixes.
        </p>
      </CardContent>
    </Card>
  )
}
