"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { PlanEffort, StudyPlan } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError } from "@/lib/api/client"
import { addDays, todayIso, WEEKDAY_LABELS } from "@/components/plan/task-meta"
import { cn } from "@/lib/utils"

const EFFORT_LABEL: Record<PlanEffort, string> = {
  light: "Light",
  standard: "Standard",
  intense: "Intense",
}

interface PlanSettingsDialogProps {
  plan: StudyPlan
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Edit target date, study days, and intensity. Saving regenerates the plan
 * for its own exam from the latest progress.
 */
export function PlanSettingsDialog({ plan, open, onOpenChange }: PlanSettingsDialogProps) {
  const updatePlanSettings = useSessionStore((s) => s.updatePlanSettings)
  const [targetDate, setTargetDate] = useState(plan.targetDate)
  const [restDays, setRestDays] = useState<number[]>(plan.restDays)
  const [effort, setEffort] = useState<PlanEffort>(plan.effort)
  const [saving, setSaving] = useState(false)

  const today = todayIso()

  // Re-seed the form each time the dialog opens (or the plan regenerates).
  useEffect(() => {
    if (!open) return
    setTargetDate(plan.targetDate > today ? plan.targetDate : addDays(today, 28))
    setRestDays(plan.restDays)
    setEffort(plan.effort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan.id])

  function toggleRestDay(day: number) {
    setRestDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : prev.length >= 6
          ? prev
          : [...prev, day],
    )
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      await updatePlanSettings({ targetDate, restDays, effort })
      toast.success("Plan rebuilt with your new settings.")
      onOpenChange(false)
    } catch (err) {
      toast.error(
        err instanceof ApiClientError ? err.message : "Couldn't update the plan.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan settings</DialogTitle>
          <DialogDescription>
            Changes rebuild your schedule from your latest progress. Completed
            work stays counted in your mastery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Exam date
            <input
              type="date"
              value={targetDate}
              min={addDays(today, 1)}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Study days</p>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Intensity</p>
            <div className="flex gap-2">
              {(Object.keys(EFFORT_LABEL) as PlanEffort[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={effort === value}
                  onClick={() => setEffort(value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-xs font-medium transition-colors",
                    effort === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {EFFORT_LABEL[value]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || targetDate <= today || restDays.length > 6}
          >
            {saving ? (
              <>
                <Spinner data-icon="inline-start" />
                Rebuilding…
              </>
            ) : (
              "Save & rebuild"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
