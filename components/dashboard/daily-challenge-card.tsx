"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Swords, Lock, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"
import type { ChallengeDay } from "@/types"

/** Trailing 28-day dot calendar of challenge completions. */
function ChallengeCalendar({ days }: { days: ChallengeDay[] }) {
  if (days.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1" aria-hidden="true">
      {days.map((day) => (
        <span
          key={day.date}
          title={
            day.completed
              ? `${day.date}: ${day.scorePct ?? 0}%`
              : `${day.date}: missed`
          }
          className={cn(
            "size-2.5 rounded-full",
            day.completed ? "bg-primary" : "bg-muted",
          )}
        />
      ))}
    </div>
  )
}

/**
 * The daily return hook: five questions drawn from the learner's own history,
 * worth bonus XP and free of the daily question limit.
 */
export function DailyChallengeCard() {
  const challenge = useSessionStore((s) => s.challenge)
  const startChallenge = useSessionStore((s) => s.startChallenge)
  const dataReady = useSessionStore((s) => s.dataReady)
  const [starting, setStarting] = useState(false)
  const router = useRouter()

  if (!challenge) return dataReady ? null : <CardSkeleton rows={3} />

  const { status, challengeStreak, calendar, questionCount, scorePct } = challenge

  async function handleStart() {
    setStarting(true)
    try {
      const session = await startChallenge()
      router.push(`/quiz/${session.id}`)
    } catch {
      toast.error("Couldn't start today's challenge. Try again in a moment.")
      setStarting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card
        className={cn(
          status === "ready" && "border-primary/40 bg-primary/5",
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {status === "locked" ? (
              <Lock className="size-4 text-muted-foreground" />
            ) : (
              <Swords className="size-4 text-primary" />
            )}
            Daily challenge
          </CardTitle>
          <CardDescription>
            {status === "locked"
              ? "Answer a few practice questions to unlock your first challenge."
              : status === "completed"
                ? `Done for today — you scored ${scorePct ?? 0}%.`
                : `${questionCount ?? 5} questions from your weak spots. Free, and worth bonus XP.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {status === "ready" && (
            <Button onClick={handleStart} disabled={starting} className="w-fit">
              {starting ? "Starting…" : "Start challenge"}
            </Button>
          )}
          {status === "completed" && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <Check className="size-4" />
              Come back tomorrow to keep the run going.
            </p>
          )}

          {challengeStreak > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {challengeStreak}
              </span>{" "}
              day{challengeStreak === 1 ? "" : "s"} in a row
            </p>
          )}
          <ChallengeCalendar days={calendar} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
