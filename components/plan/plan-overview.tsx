"use client"

import { useState } from "react"
import { CalendarDays, List } from "lucide-react"
import type { StudyPlan } from "@/types"
import { Button } from "@/components/ui/button"
import { PlanHeader } from "@/components/plan/plan-header"
import { PlanToday } from "@/components/plan/plan-today"
import { PlanPaceCoaching } from "@/components/plan/plan-pace-coaching"
import { PlanWeekList } from "@/components/plan/plan-week-list"
import { PlanCalendar } from "@/components/plan/plan-calendar"
import { useTaskLauncher } from "@/components/plan/use-task-launcher"

/**
 * Active-plan page layout, today-first: compact header, today's tasks,
 * pace + coaching, then the full schedule as weeks or a calendar.
 */
export function PlanOverview({ plan }: { plan: StudyPlan }) {
  const { launch, launchingId } = useTaskLauncher(plan)
  const [view, setView] = useState<"weeks" | "calendar">("weeks")

  return (
    <div className="flex flex-col gap-6">
      <PlanHeader plan={plan} />

      <PlanToday plan={plan} launchingId={launchingId} onStart={launch} />

      <PlanPaceCoaching plan={plan} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Full schedule</h2>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button
            variant={view === "weeks" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("weeks")}
          >
            <List data-icon="inline-start" />
            Weeks
          </Button>
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <CalendarDays data-icon="inline-start" />
            Calendar
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <PlanCalendar plan={plan} launchingId={launchingId} onStart={launch} />
      ) : (
        <PlanWeekList plan={plan} launchingId={launchingId} onStart={launch} />
      )}
    </div>
  )
}
