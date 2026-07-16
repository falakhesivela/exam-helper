"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { UserPlus, Users } from "lucide-react"
import { toast } from "sonner"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamAssignments } from "@/components/team/team-assignments"
import { TeamMembers } from "@/components/team/team-members"
import { TeamOverview } from "@/components/team/team-overview"
import { TeamSettings } from "@/components/team/team-settings"
import { api, ApiClientError } from "@/lib/api/client"
import { isPaidTier } from "@/lib/config/tiers"
import { TEAM_PRICE_LABEL } from "@/lib/config/pricing"
import { useSessionStore } from "@/lib/store/use-session-store"
import { AccountGate } from "@/components/auth/account-gate"
import type { Team } from "@/types"

export default function TeamPage() {
  return (
    <AccountGate feature="Teams">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Spinner className="size-6" />
          </div>
        }
      >
        <TeamPageInner />
      </Suspense>
    </AccountGate>
  )
}

function TeamPageInner() {
  const token = useSearchParams().get("token")
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!team) {
    return <EmptyState token={token} onJoined={setTeam} />
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-0.5"
      >
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Users className="size-5 text-primary" />
          {team.name}
          {team.plan === "team" && <Badge>Team plan</Badge>}
        </h1>
        <p className="text-sm text-muted-foreground">
          {team.seatsUsed} {team.seatsUsed === 1 ? "member" : "members"}
          {team.plan === "team" && team.seats ? ` of ${team.seats} seats` : ""}
          {" · you're the "}
          {team.role}
        </p>
      </motion.div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <TeamOverview team={team} />
        </TabsContent>
        <TabsContent value="assignments">
          <TeamAssignments team={team} />
        </TabsContent>
        <TabsContent value="members">
          <TeamMembers team={team} onTeamChange={setTeam} />
        </TabsContent>
        <TabsContent value="settings">
          <TeamSettings team={team} onTeamChange={setTeam} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({
  token,
  onJoined,
}: {
  token: string | null
  onJoined: (team: Team) => void
}) {
  const plan = useSessionStore((s) => s.profile.plan)
  const canCreate = isPaidTier(plan)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)

  async function createTeam() {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      onJoined(await api.createTeam(name.trim()))
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
      onJoined(await api.joinTeam(token))
      toast.success("You joined the team!")
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't join")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-col items-center gap-2 pt-6 text-center">
        <Users className="size-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <p className="text-sm text-muted-foreground">
          Track a cohort or study group&apos;s progress in one place — and put
          everyone on Pro with seat-based billing ({TEAM_PRICE_LABEL}/seat/mo).
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
          <CardDescription>
            {canCreate
              ? "You'll be the owner and can invite members."
              : "Creating a team is a Pro feature — teammates join free."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {canCreate ? (
            <>
              <Input
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team name (e.g. Cloud Bootcamp Cohort 7)"
              />
              <Button onClick={() => void createTeam()} disabled={busy || !name.trim()}>
                {busy ? <Spinner data-icon="inline-start" /> : null}
                Create team
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/upgrade">Start a team with Pro</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
