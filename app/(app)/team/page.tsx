"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Copy, Trophy, UserPlus, Users, X } from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { ApiClientError } from "@/lib/api/client"
import type { Team, TeamMember } from "@/types"

function lastActiveLabel(date: string | null): string {
  if (!date) return "never"
  const days = Math.round(
    (Date.now() - new Date(`${date}T00:00:00Z`).getTime()) / 86_400_000,
  )
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days}d ago`
}

export default function TeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      }
    >
      <TeamPageInner />
    </Suspense>
  )
}

function TeamPageInner() {
  const token = useSearchParams().get("token")
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .team()
      .then((t) => !cancelled && setTeam(t))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  async function createTeam() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      setTeam(await api.createTeam(name.trim()))
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't create team")
    } finally {
      setBusy(false)
    }
  }

  async function join() {
    if (!token || busy) return
    setBusy(true)
    try {
      setTeam(await api.joinTeam(token))
      toast.success("You joined the team!")
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't join")
    } finally {
      setBusy(false)
    }
  }

  async function invite() {
    setBusy(true)
    try {
      const { token: t } = await api.inviteToTeam()
      const url = `${window.location.origin}/team?token=${t}`
      setInviteUrl(url)
      await navigator.clipboard.writeText(url).catch(() => {})
      toast.success("Invite link copied!")
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't create invite")
    } finally {
      setBusy(false)
    }
  }

  async function removeMember(m: TeamMember) {
    if (!team) return
    setTeam({ ...team, members: team.members.filter((x) => x.userId !== m.userId) })
    try {
      await api.removeTeamMember(m.userId)
    } catch {
      toast.error("Couldn't remove member")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  // Not in a team — show join (if invited) and/or create.
  if (!team) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <div className="flex flex-col items-center gap-2 pt-6 text-center">
          <Users className="size-8 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-sm text-muted-foreground">
            Track a cohort or study group&apos;s progress in one place.
          </p>
        </div>

        {token && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-5">
              <p className="text-sm">You&apos;ve been invited to join a team.</p>
              <Button onClick={() => void join()} disabled={busy}>
                {busy ? <Spinner data-icon="inline-start" /> : <UserPlus data-icon="inline-start" />}
                Join team
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Create a team</CardTitle>
            <CardDescription>You&apos;ll be the owner and can invite members.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team name (e.g. Cloud Bootcamp Cohort 7)"
              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={() => void createTeam()} disabled={busy || !name.trim()}>
              {busy ? <Spinner data-icon="inline-start" /> : null}
              Create team
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManage = team.role === "owner" || team.role === "admin"

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex flex-col gap-0.5">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Users className="size-5 text-primary" />
            {team.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {team.members.length} {team.members.length === 1 ? "member" : "members"} · you&apos;re the {team.role}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => void invite()} disabled={busy}>
            <UserPlus data-icon="inline-start" />
            Invite
          </Button>
        )}
      </motion.div>

      {inviteUrl && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-2 p-3">
            <Check className="size-4 shrink-0 text-primary" />
            <code className="flex-1 truncate text-xs text-muted-foreground">{inviteUrl}</code>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Copy invite link"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl)
                toast.success("Copied!")
              }}
            >
              <Copy />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-1 p-2">
          {team.members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase">
                {(m.name || m.email).slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{m.name || m.email}</span>
                  {m.role !== "member" && (
                    <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.questionsAnswered} answered · streak {m.streakDays}d · active {lastActiveLabel(m.lastActiveDate)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Trophy className="size-3.5 text-primary" />
                <span className="text-sm font-semibold tabular-nums">{m.overallMastery}%</span>
              </div>
              {team.role === "owner" && m.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${m.name}`}
                  onClick={() => void removeMember(m)}
                >
                  <X />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
