"use client"

import { useState } from "react"
import { CalendarCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"
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
import { ApiClientError } from "@/lib/api/client"

function defaultTarget(): string {
  const d = new Date()
  d.setDate(d.getDate() + 28)
  return d.toISOString().slice(0, 10)
}

function minTarget(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Shown when the user has no active plan — pick an exam date and generate one. */
export function PlanSetup() {
  const createPlan = useSessionStore((s) => s.createPlan)
  const [targetDate, setTargetDate] = useState(defaultTarget())
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (creating) return
    setCreating(true)
    try {
      await createPlan(targetDate)
      toast.success("Your study plan is ready!")
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : "Couldn't build a plan. Try again."
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-5 text-primary" />
          Build your study plan
        </CardTitle>
        <CardDescription>
          Tell us your exam date and we&apos;ll map a day-by-day path to your
          pass mark, front-loading your weakest domains.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Target exam date
          <input
            type="date"
            value={targetDate}
            min={minTarget()}
            onChange={(e) => setTargetDate(e.target.value)}
            className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <Button onClick={() => void handleCreate()} disabled={creating}>
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
        <p className="text-xs text-muted-foreground">
          Based on your recent practice and the exam blueprint. You can
          regenerate it anytime as your mastery improves.
        </p>
      </CardContent>
    </Card>
  )
}
