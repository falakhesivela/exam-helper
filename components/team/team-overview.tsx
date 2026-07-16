"use client"

import { Activity, AlertTriangle, Target, Trophy, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Team, TeamMember } from "@/types"

const DAY_MS = 86_400_000

function daysSince(date: string | null): number | null {
  if (!date) return null
  return Math.round((Date.now() - new Date(`${date}T00:00:00Z`).getTime()) / DAY_MS)
}

/** Members who look like they're falling behind, with the reason. */
function atRisk(members: TeamMember[]): { member: TeamMember; reason: string }[] {
  const flagged: { member: TeamMember; reason: string }[] = []
  for (const m of members) {
    const idle = daysSince(m.lastActiveDate)
    if (idle === null) {
      flagged.push({ member: m, reason: "hasn't started yet" })
    } else if (idle >= 7) {
      flagged.push({ member: m, reason: `inactive for ${idle} days` })
    } else if (m.overallMastery < 40 && m.questionsAnswered >= 20) {
      flagged.push({ member: m, reason: `mastery at ${m.overallMastery}%` })
    }
  }
  return flagged
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  )
}

export function TeamOverview({ team }: { team: Team }) {
  const members = team.members
  const withProgress = members.filter((m) => m.questionsAnswered > 0)
  const avgMastery = withProgress.length
    ? Math.round(withProgress.reduce((s, m) => s + m.overallMastery, 0) / withProgress.length)
    : 0
  const activeThisWeek = members.filter((m) => {
    const idle = daysSince(m.lastActiveDate)
    return idle !== null && idle < 7
  }).length
  const totalQuestions = members.reduce((s, m) => s + m.questionsAnswered, 0)
  const flagged = atRisk(members)
  const weeklyLeaders = [...members]
    .filter((m) => m.weeklyQuestions > 0)
    .sort((a, b) => b.weeklyQuestions - a.weeklyQuestions)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Average mastery" value={`${avgMastery}%`} />
        <Stat
          label="Active this week"
          value={`${activeThisWeek}/${members.length}`}
        />
        <Stat label="Questions answered" value={totalQuestions.toLocaleString()} />
        <Stat
          label="Seats"
          value={
            team.plan === "team" && team.seats
              ? `${team.seatsUsed}/${team.seats}`
              : `${team.seatsUsed}`
          }
          hint={team.plan === "team" ? "Team plan" : "No team plan"}
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
        <Target className="size-4 shrink-0 text-primary" />
        {team.targetExam ? (
          <span>
            Progress scoped to <span className="font-medium">{team.targetExam}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            No focus exam set — stats blend every exam members practise. Set one
            in Settings.
          </span>
        )}
      </div>

      {weeklyLeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" />
              This week&apos;s leaderboard
            </CardTitle>
            <CardDescription>Questions answered in the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {weeklyLeaders.map((m, i) => (
              <div key={m.userId} className="flex items-center gap-3 text-sm">
                <span className="w-4 text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="flex-1 truncate font-medium">{m.name || "Unnamed"}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {m.overallMastery}% mastery
                </span>
                <span className="w-14 text-right font-semibold tabular-nums">
                  {m.weeklyQuestions}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {flagged.length > 0 ? (
              <AlertTriangle className="size-4 text-amber-500" />
            ) : (
              <Activity className="size-4 text-primary" />
            )}
            Needs attention
          </CardTitle>
          <CardDescription>
            Inactive for a week, low mastery, or not started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {flagged.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              Everyone is on track this week.
            </p>
          ) : (
            flagged.map(({ member, reason }) => (
              <div key={member.userId} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate font-medium">
                  {member.name || member.email || "Unnamed"}
                </span>
                <Badge variant="secondary" className="font-normal">{reason}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
