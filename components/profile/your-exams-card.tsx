"use client"

import { useState } from "react"
import { CalendarDays, GraduationCap, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { listExamPresetsByProvider } from "@/lib/exams"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { UserExam } from "@/types"
import { cn } from "@/lib/utils"

const PROVIDER_LABELS: Record<string, string> = {
  aws: "AWS",
  azure: "Microsoft Azure",
  gcp: "Google Cloud",
  comptia: "CompTIA",
  cisco: "Cisco",
  isc2: "ISC2",
}

/** Profile card: exams the user is studying, with dates, add and remove. */
export function YourExamsCard() {
  const userExams = useSessionStore((s) => s.userExams)
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const setActiveExam = useSessionStore((s) => s.setActiveExam)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)

  function setExams(exams: UserExam[]) {
    useSessionStore.setState({ userExams: exams })
  }

  async function handleAdd(examCode: string, exam: string) {
    setBusy(true)
    try {
      const { exams } = await api.addUserExam({ examCode, exam })
      setExams(exams)
      setAdding(false)
      toast.success(`${examCode} added`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add exam")
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(examCode: string) {
    setBusy(true)
    try {
      const { exams } = await api.removeUserExam(examCode)
      setExams(exams)
      if (activeExamCode === examCode && exams.length > 0) {
        void setActiveExam(exams[0].examCode)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove exam")
    } finally {
      setBusy(false)
    }
  }

  async function handleDateChange(examCode: string, date: string) {
    try {
      const { exams } = await api.updateUserExam(
        examCode,
        date ? { examDate: date } : { clearExamDate: true },
      )
      setExams(exams)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save date")
    }
  }

  const existing = new Set(userExams.map((e) => e.examCode))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="size-4 text-primary" />
          Your exams
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding((a) => !a)}
          disabled={busy}
        >
          {adding ? (
            <X data-icon="inline-start" />
          ) : (
            <Plus data-icon="inline-start" />
          )}
          {adding ? "Close" : "Add exam"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {userExams.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">
            No exams yet. Add the certification you&apos;re studying for.
          </p>
        )}

        {userExams.map((e) => (
          <div
            key={e.examCode}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
          >
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-sm font-medium">
                {e.examCode}
                {e.examCode === activeExamCode && (
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                )}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {e.exam}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" />
                <input
                  type="date"
                  value={e.examDate ?? ""}
                  onChange={(ev) => void handleDateChange(e.examCode, ev.target.value)}
                  aria-label={`Exam date for ${e.examCode}`}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void handleRemove(e.examCode)}
                disabled={busy}
                aria-label={`Remove ${e.examCode}`}
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}

        {adding && (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-3">
            {listExamPresetsByProvider().map(({ provider, presets }) => (
              <div key={provider} className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {PROVIDER_LABELS[provider] ?? provider}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.examCode}
                      type="button"
                      disabled={busy || existing.has(p.examCode)}
                      onClick={() => void handleAdd(p.examCode, p.exam)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs transition-colors",
                        existing.has(p.examCode)
                          ? "border-border text-muted-foreground opacity-50"
                          : "border-primary/30 text-primary hover:bg-primary/10",
                      )}
                    >
                      {p.examCode}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
