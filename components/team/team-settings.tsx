"use client"

import { useEffect, useState } from "react"
import { Check, Copy, CreditCard, Link2, Minus, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useTeamCheckout } from "@/components/upgrade/use-team-checkout"
import { api, ApiClientError } from "@/lib/api/client"
import {
  TEAM_MAX_SEATS,
  TEAM_MIN_SEATS,
  TEAM_PRICE_LABEL,
} from "@/lib/config/pricing"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { Team, TeamBilling, TeamInvite } from "@/types"

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiClientError ? err.message : fallback
}

interface TeamSettingsProps {
  team: Team
  onTeamChange: (team: Team | null) => void
}

export function TeamSettings({ team, onTeamChange }: TeamSettingsProps) {
  const isOwner = team.role === "owner"

  return (
    <div className="flex flex-col gap-4">
      <GeneralCard team={team} onTeamChange={onTeamChange} />
      <InvitesCard team={team} />
      <PlanCard team={team} onTeamChange={onTeamChange} />
      {isOwner && <DangerCard team={team} onTeamChange={onTeamChange} />}
    </div>
  )
}

function GeneralCard({ team, onTeamChange }: TeamSettingsProps) {
  const userExams = useSessionStore((s) => s.userExams)
  const [name, setName] = useState(team.name)
  const [busy, setBusy] = useState(false)

  // Keep the current target selectable even when the viewer doesn't study it.
  const examOptions = [...userExams]
  if (
    team.targetExamCode &&
    !examOptions.some((e) => e.examCode === team.targetExamCode)
  ) {
    examOptions.unshift({
      examCode: team.targetExamCode,
      exam: team.targetExam || team.targetExamCode,
      examDate: null,
      isPreset: true,
    })
  }

  async function save(patch: Parameters<typeof api.updateTeam>[0]) {
    setBusy(true)
    try {
      onTeamChange(await api.updateTeam(patch))
      toast.success("Team updated")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the team"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
        <CardDescription>
          The focus exam scopes every member stat on this page to one
          certification.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="team-name" className="text-sm font-medium">
            Team name
          </label>
          <div className="flex gap-2">
            <Input
              id="team-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              variant="outline"
              disabled={busy || !name.trim() || name.trim() === team.name}
              onClick={() => void save({ name: name.trim() })}
            >
              Save
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="team-exam" className="text-sm font-medium">
            Focus exam
          </label>
          <select
            id="team-exam"
            value={team.targetExamCode ?? ""}
            disabled={busy}
            onChange={(e) => {
              const code = e.target.value
              const exam = examOptions.find((x) => x.examCode === code)
              void save({ targetExamCode: code, targetExam: exam?.exam })
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All exams (blended)</option>
            {examOptions.map((exam) => (
              <option key={exam.examCode} value={exam.examCode}>
                {exam.exam} ({exam.examCode})
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

function inviteUrlFor(token: string): string {
  return `${window.location.origin}/team?token=${token}`
}

function InvitesCard({ team }: { team: Team }) {
  const [invites, setInvites] = useState<TeamInvite[] | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .teamInvites()
      .then((r) => !cancelled && setInvites(r.invites))
      .catch(() => !cancelled && setInvites([]))
    return () => {
      cancelled = true
    }
  }, [team.id])

  async function createInvite() {
    setBusy(true)
    try {
      const { token } = await api.inviteToTeam()
      await navigator.clipboard.writeText(inviteUrlFor(token)).catch(() => {})
      toast.success("Invite link created and copied!")
      setInvites(await api.teamInvites().then((r) => r.invites))
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't create invite"))
    } finally {
      setBusy(false)
    }
  }

  async function revoke(token: string) {
    setInvites((prev) => prev?.filter((i) => i.token !== token) ?? null)
    try {
      await api.revokeTeamInvite(token)
      toast.success("Invite revoked")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't revoke invite"))
      setInvites(await api.teamInvites().then((r) => r.invites).catch(() => []))
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Invite links</CardTitle>
          <CardDescription>
            Anyone with a link can join until it expires or you revoke it.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void createInvite()}>
          {busy ? <Spinner data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
          New link
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {invites === null ? (
          <Spinner className="size-4" />
        ) : invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active invite links.</p>
        ) : (
          invites.map((invite) => (
            <div
              key={invite.token}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
            >
              <code className="flex-1 truncate text-xs text-muted-foreground">
                …{invite.token.slice(-8)}
              </code>
              <span className="shrink-0 text-xs text-muted-foreground">
                {invite.expiresAt
                  ? `expires ${new Date(invite.expiresAt).toLocaleDateString()}`
                  : "no expiry"}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Copy invite link"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrlFor(invite.token))
                  toast.success("Copied!")
                }}
              >
                <Copy />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Revoke invite"
                onClick={() => void revoke(invite.token)}
              >
                <X />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function PlanCard({ team, onTeamChange }: TeamSettingsProps) {
  const isOwner = team.role === "owner"
  const hasPlan = team.plan === "team"
  const [billing, setBilling] = useState<TeamBilling | null>(null)
  const [seats, setSeats] = useState(
    () => team.seats ?? Math.max(TEAM_MIN_SEATS, team.seatsUsed),
  )
  const [busy, setBusy] = useState(false)
  const { startCheckout, loading: checkoutLoading } = useTeamCheckout(
    team.id,
    () => void api.team().then(onTeamChange).catch(() => {}),
  )

  useEffect(() => {
    if (!hasPlan) return
    let cancelled = false
    api
      .teamBilling()
      .then((b) => !cancelled && setBilling(b))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [hasPlan, team.id])

  const minSeats = hasPlan ? Math.max(1, team.seatsUsed) : TEAM_MIN_SEATS

  function stepSeats(delta: number) {
    setSeats((s) => Math.min(TEAM_MAX_SEATS, Math.max(minSeats, s + delta)))
  }

  async function applySeats() {
    setBusy(true)
    try {
      await api.updateTeamSeats(seats)
      toast.success(`Team updated to ${seats} seats`)
      onTeamChange(await api.team())
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update seats"))
    } finally {
      setBusy(false)
    }
  }

  async function cancelPlan() {
    setBusy(true)
    try {
      const result = await api.cancelTeamSubscription()
      setBilling((prev) =>
        prev ? { ...prev, cancelEffectiveAt: result.cancelEffectiveAt } : prev,
      )
      toast.success("Team plan will end at the current billing period.")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't cancel the subscription"))
    } finally {
      setBusy(false)
    }
  }

  const seatStepper = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Fewer seats"
        disabled={seats <= minSeats}
        onClick={() => stepSeats(-1)}
      >
        <Minus />
      </Button>
      <span className="w-10 text-center text-sm font-semibold tabular-nums">{seats}</span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="More seats"
        disabled={seats >= TEAM_MAX_SEATS}
        onClick={() => stepSeats(1)}
      >
        <Plus />
      </Button>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-primary" />
          Team plan
        </CardTitle>
        <CardDescription>
          {hasPlan
            ? `Every member on a seat gets Pro-level limits. ${team.seatsUsed} of ${team.seats ?? "?"} seats in use.`
            : `${TEAM_PRICE_LABEL}/seat per month — every member gets Pro-level limits, billed on one invoice.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {hasPlan ? (
          <>
            {billing?.nextBilledAt && !billing.cancelEffectiveAt && (
              <p className="text-sm text-muted-foreground">
                Next billed {new Date(billing.nextBilledAt).toLocaleDateString()}.
              </p>
            )}
            {billing?.cancelEffectiveAt && (
              <p className="text-sm text-amber-600 dark:text-amber-500">
                Plan ends {new Date(billing.cancelEffectiveAt).toLocaleDateString()}.
              </p>
            )}
            {isOwner && (
              <div className="flex flex-wrap items-center gap-3">
                {seatStepper}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy || seats === team.seats}
                  onClick={() => void applySeats()}
                >
                  {busy ? <Spinner data-icon="inline-start" /> : <Check data-icon="inline-start" />}
                  Update seats
                </Button>
                {billing?.updatePaymentUrl && (
                  <Button asChild variant="ghost" size="sm">
                    <a href={billing.updatePaymentUrl} target="_blank" rel="noreferrer">
                      Update payment method
                    </a>
                  </Button>
                )}
                {!billing?.cancelEffectiveAt && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={busy}>
                        Cancel plan
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel the team plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Members keep Pro-level limits until the end of the
                          current billing period, then drop to Free.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep plan</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void cancelPlan()}>
                          Cancel plan
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </>
        ) : isOwner ? (
          <div className="flex flex-wrap items-center gap-3">
            {seatStepper}
            <Button disabled={checkoutLoading} onClick={() => void startCheckout(seats)}>
              {checkoutLoading ? <Spinner data-icon="inline-start" /> : null}
              Get Team plan — {TEAM_PRICE_LABEL}/seat/mo
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ask the team owner to upgrade so every member gets Pro-level limits.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function DangerCard({ team, onTeamChange }: TeamSettingsProps) {
  const [busy, setBusy] = useState(false)

  async function deleteTeam() {
    setBusy(true)
    try {
      await api.deleteTeam()
      toast.success("Team deleted")
      onTeamChange(null)
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the team"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base">Danger zone</CardTitle>
        <CardDescription>
          {team.plan === "team"
            ? "Cancel the team subscription before deleting the team."
            : "Deleting removes every member and all invite links. Progress data stays on each member's account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={busy}>
              {busy ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
              Delete team
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {team.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes all {team.members.length} members and can&apos;t be
                undone. Each member keeps their personal progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep team</AlertDialogCancel>
              <AlertDialogAction onClick={() => void deleteTeam()}>
                Delete team
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
