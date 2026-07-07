"use client"

import { useState } from "react"
import {
  Download,
  MoreHorizontal,
  RotateCcw,
  Settings2,
  Target,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import type { StudyPlan } from "@/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PlanSettingsDialog } from "@/components/plan/plan-settings-dialog"
import { buildPlanIcs } from "@/lib/plan/ics"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError } from "@/lib/api/client"
import { daysUntil, formatShortDate } from "@/components/plan/task-meta"

/**
 * Compact plan summary strip: exam, countdown, progress, projection, and the
 * plan lifecycle menu (settings, regenerate, export, delete).
 */
export function PlanHeader({ plan }: { plan: StudyPlan }) {
  const updatePlanSettings = useSessionStore((s) => s.updatePlanSettings)
  const deletePlan = useSessionStore((s) => s.deletePlan)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const done = plan.tasks.filter((t) => t.status === "done").length
  const active = plan.tasks.filter((t) => t.status !== "skipped").length
  const pct = active > 0 ? Math.round((done / active) * 100) : 0
  const days = daysUntil(plan.targetDate)

  function downloadIcs() {
    const ics = buildPlanIcs(plan)
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `prepa-${plan.examCode.toLowerCase()}-plan.ics`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Calendar file downloaded — import it into your calendar.")
  }

  async function regenerate() {
    if (busy) return
    setBusy(true)
    try {
      await updatePlanSettings({})
      toast.success("Plan regenerated from your latest progress.")
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "TARGET_PASSED") {
        toast.info("Your exam date has passed — pick a new one.")
        setSettingsOpen(true)
      } else {
        toast.error(
          err instanceof ApiClientError ? err.message : "Couldn't regenerate the plan.",
        )
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    try {
      await deletePlan()
      toast.success("Plan deleted. Build a new one anytime.")
    } catch {
      toast.error("Couldn't delete the plan.")
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 shrink-0 text-primary" />
            <span className="truncate">{plan.exam}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {plan.examCode} ·{" "}
            {days > 0
              ? `exam in ${days} day${days === 1 ? "" : "s"} (${formatShortDate(plan.targetDate)})`
              : "exam date has passed — update it in settings"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {plan.projectedScore}% → target {plan.targetScore}%
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Plan options" className="size-8" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings2 data-icon="inline-start" />
                Edit plan settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void regenerate()} disabled={busy}>
                <RotateCcw data-icon="inline-start" />
                Regenerate from progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadIcs}>
                <Download data-icon="inline-start" />
                Add to calendar (.ics)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 data-icon="inline-start" />
                Delete plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1" />
        <span className="shrink-0 text-xs text-muted-foreground">
          {done}/{active} tasks · {pct}%
        </span>
      </div>

      <PlanSettingsDialog plan={plan} open={settingsOpen} onOpenChange={setSettingsOpen} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this study plan?</AlertDialogTitle>
            <AlertDialogDescription>
              The schedule goes away, but your practice history and mastery are
              untouched. You can build a fresh plan anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep plan</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>
              Delete plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
