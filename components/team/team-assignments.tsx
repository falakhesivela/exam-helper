"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, ClipboardList, Play, Plus, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { api, ApiClientError } from "@/lib/api/client"
import type {
  PracticeSession,
  Team,
  TeamAssignment,
  TeamAssignmentResults,
} from "@/types"

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiClientError ? err.message : fallback
}

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

export function TeamAssignments({ team }: { team: Team }) {
  const router = useRouter()
  const canManage = team.role === "owner" || team.role === "admin"
  const [assignments, setAssignments] = useState<TeamAssignment[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [resultsFor, setResultsFor] = useState<TeamAssignment | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function refresh() {
    try {
      const { assignments: list } = await api.teamAssignments()
      setAssignments(list)
    } catch {
      setAssignments([])
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id])

  async function start(assignment: TeamAssignment) {
    setBusyId(assignment.id)
    try {
      const { sessionId } = await api.startTeamAssignment(assignment.id)
      router.push(`/exam/${sessionId}`)
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't start the exam"))
      setBusyId(null)
    }
  }

  async function remove(assignment: TeamAssignment) {
    setBusyId(assignment.id)
    try {
      await api.deleteTeamAssignment(assignment.id)
      toast.success("Assignment deleted")
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the assignment"))
    } finally {
      setBusyId(null)
    }
  }

  if (assignments === null) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-5" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {canManage && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Everyone takes the same questions, so results are comparable.
          </p>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus data-icon="inline-start" />
            Assign a mock
          </Button>
        </div>
      )}

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ClipboardList className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No assignments yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {canManage
                ? "Generate a mock exam from the Exam page, then assign it here — every member gets the identical questions."
                : "When your team lead assigns a mock exam, it shows up here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((a) => {
          const attempt = a.myAttempt
          const scorePct = attempt ? pct(attempt.correct, a.questionCount) : 0
          const overdue = a.dueAt && new Date(a.dueAt).getTime() < Date.now()
          return (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{a.title}</span>
                    <Badge variant="secondary">{a.examCode}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.questionCount} questions
                    {a.durationSec ? ` · ${Math.round(a.durationSec / 60)} min` : ""}
                    {a.dueAt
                      ? ` · due ${new Date(a.dueAt).toLocaleDateString()}${overdue ? " (past due)" : ""}`
                      : ""}
                    {typeof a.completedCount === "number"
                      ? ` · ${a.completedCount}/${team.seatsUsed} completed`
                      : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {attempt?.status === "completed" ? (
                    <>
                      <span className="text-sm font-semibold tabular-nums">
                        {scorePct}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/history/${attempt.sessionId}`)}
                      >
                        Review
                      </Button>
                    </>
                  ) : attempt ? (
                    <Button
                      size="sm"
                      disabled={busyId === a.id}
                      onClick={() => router.push(`/exam/${attempt.sessionId}`)}
                    >
                      <RotateCcw data-icon="inline-start" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={busyId === a.id}
                      onClick={() => void start(a)}
                    >
                      {busyId === a.id ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <Play data-icon="inline-start" />
                      )}
                      Start
                    </Button>
                  )}
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResultsFor(a)}
                      >
                        <BarChart3 data-icon="inline-start" />
                        Results
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${a.title}`}
                        disabled={busyId === a.id}
                        onClick={() => void remove(a)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {creating && (
        <CreateAssignmentDialog
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            void refresh()
          }}
        />
      )}
      {resultsFor && (
        <ResultsDialog
          assignment={resultsFor}
          onClose={() => setResultsFor(null)}
        />
      )}
    </div>
  )
}

function CreateAssignmentDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [sessions, setSessions] = useState<PracticeSession[] | null>(null)
  const [sourceId, setSourceId] = useState("")
  const [title, setTitle] = useState("")
  const [dueAt, setDueAt] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .listSessions({ summary: true })
      .then((all) => {
        if (cancelled) return
        setSessions(
          all.filter(
            (s) =>
              s.mode === "exam" &&
              (s.generationStatus ?? "complete") === "complete" &&
              (s.scoreSummary?.total ?? s.questions.length) > 0,
          ),
        )
      })
      .catch(() => !cancelled && setSessions([]))
    return () => {
      cancelled = true
    }
  }, [])

  const source = useMemo(
    () => sessions?.find((s) => s.id === sourceId) ?? null,
    [sessions, sourceId],
  )

  async function create() {
    if (!sourceId || !title.trim() || busy) return
    setBusy(true)
    try {
      await api.createTeamAssignment({
        sourceSessionId: sourceId,
        title: title.trim(),
        dueAt: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : null,
      })
      toast.success("Assignment created — your team can start it now.")
      onCreated()
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't create the assignment"))
      setBusy(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a mock exam</DialogTitle>
          <DialogDescription>
            Pick one of your generated mock exams — its exact questions are
            copied to every member. Need a fresh one? Generate it on the Exam
            page first.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assignment-source" className="text-sm font-medium">
              Source mock exam
            </label>
            {sessions === null ? (
              <Spinner className="size-4" />
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No mock exams yet — generate one on the Exam page first.
              </p>
            ) : (
              <select
                id="assignment-source"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose an exam…</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.examCode} · {s.scoreSummary?.total ?? s.questions.length}{" "}
                    questions · {new Date(s.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="assignment-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="assignment-title"
              value={title}
              maxLength={120}
              placeholder={source ? `${source.examCode} checkpoint` : "e.g. Week 4 checkpoint"}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="assignment-due" className="text-sm font-medium">
              Due date <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="assignment-due"
              type="date"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy || !sourceId || !title.trim()} onClick={() => void create()}>
            {busy ? <Spinner data-icon="inline-start" /> : null}
            Assign to team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResultsDialog({
  assignment,
  onClose,
}: {
  assignment: TeamAssignment
  onClose: () => void
}) {
  const [results, setResults] = useState<TeamAssignmentResults | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .teamAssignmentResults(assignment.id)
      .then((r) => !cancelled && setResults(r))
      .catch(() => !cancelled && onClose())
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment.id])

  const total = assignment.questionCount

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{assignment.title}</DialogTitle>
          <DialogDescription>
            {total} questions · pass mark {assignment.passMark ?? 72}%
          </DialogDescription>
        </DialogHeader>

        {results === null ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5" />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {[...results.members]
              .sort((a, b) => pct(b.correct, total) - pct(a.correct, total))
              .map((m) => {
                const score = pct(m.correct, total)
                const passed =
                  m.status === "completed" && score >= (assignment.passMark ?? 72)
                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {m.name || m.email || "Unnamed"}
                    </span>
                    {m.status === "completed" ? (
                      <>
                        <Badge variant={passed ? "default" : "destructive"}>
                          {passed ? "Pass" : "Fail"}
                        </Badge>
                        <span className="w-12 text-right font-semibold tabular-nums">
                          {score}%
                        </span>
                      </>
                    ) : (
                      <Badge variant="secondary" className="font-normal">
                        {m.status === "in-progress" ? "in progress" : "not started"}
                      </Badge>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
