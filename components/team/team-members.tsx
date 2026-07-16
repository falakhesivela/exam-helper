"use client"

import { useState } from "react"
import { Download, MoreHorizontal, Shield, ShieldOff, Trophy, UserMinus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, ApiClientError } from "@/lib/api/client"
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

interface TeamMembersProps {
  team: Team
  onTeamChange: (team: Team | null) => void
}

export function TeamMembers({ team, onTeamChange }: TeamMembersProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const isOwner = team.role === "owner"
  const canManage = isOwner || team.role === "admin"

  async function refresh() {
    try {
      onTeamChange(await api.team())
    } catch {
      // keep current view; the mutation already succeeded
    }
  }

  async function mutate(member: TeamMember, action: () => Promise<unknown>) {
    setBusyId(member.userId)
    try {
      await action()
      await refresh()
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Something went wrong")
    } finally {
      setBusyId(null)
    }
  }

  async function leave() {
    setBusyId("me")
    try {
      await api.removeTeamMember("me")
      toast.success("You left the team")
      onTeamChange(null)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't leave the team")
      setBusyId(null)
    }
  }

  async function exportCsv() {
    try {
      const { filename, csv } = await api.exportTeamCsv()
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't export CSV")
    }
  }

  return (
    <div className="flex flex-col gap-3">
    {canManage && (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
          <Download data-icon="inline-start" />
          Export CSV
        </Button>
      </div>
    )}
    <Card>
      <CardContent className="flex flex-col gap-1 p-2">
        {team.members.map((m) => {
          const showMenu =
            canManage && m.role !== "owner" && busyId !== m.userId
          return (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold uppercase">
                {(m.name || m.email || "?").slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {m.name || m.email || "Unnamed"}
                  </span>
                  {m.role !== "member" && (
                    <Badge variant="secondary" className="capitalize">{m.role}</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email ? `${m.email} · ` : ""}
                  {m.questionsAnswered} answered · streak {m.streakDays}d · active{" "}
                  {lastActiveLabel(m.lastActiveDate)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Trophy className="size-3.5 text-primary" />
                <span className="text-sm font-semibold tabular-nums">{m.overallMastery}%</span>
              </div>
              {showMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Manage ${m.name || "member"}`}
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwner && m.role === "member" && (
                      <DropdownMenuItem
                        onClick={() =>
                          void mutate(m, () => api.setTeamMemberRole(m.userId, "admin"))
                        }
                      >
                        <Shield />
                        Make admin
                      </DropdownMenuItem>
                    )}
                    {isOwner && m.role === "admin" && (
                      <DropdownMenuItem
                        onClick={() =>
                          void mutate(m, () => api.setTeamMemberRole(m.userId, "member"))
                        }
                      >
                        <ShieldOff />
                        Remove admin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => void mutate(m, () => api.removeTeamMember(m.userId))}
                    >
                      <UserMinus />
                      Remove from team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
    {!isOwner && (
      <Button
        variant="ghost"
        size="sm"
        className="self-start text-muted-foreground"
        disabled={busyId === "me"}
        onClick={() => void leave()}
      >
        <UserMinus data-icon="inline-start" />
        Leave team
      </Button>
    )}
    </div>
  )
}
