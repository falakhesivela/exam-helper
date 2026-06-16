"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Brain, Sparkles, Target, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DailyLimitBanner } from "@/components/layout/daily-limit-banner"
import { StatCard } from "@/components/dashboard/stat-card"
import { MasteryOverview } from "@/components/dashboard/mastery-overview"
import { WeakTopics } from "@/components/dashboard/weak-topics"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { useSessionStore } from "@/lib/store/use-session-store"
import { mockTopicMastery } from "@/lib/mock-data"

export default function DashboardPage() {
  const profile = useSessionStore((s) => s.profile)
  const sessions = useSessionStore((s) => s.sessions)

  const overallMastery = Math.round(
    mockTopicMastery.reduce((sum, t) => sum + t.mastery, 0) / mockTopicMastery.length,
  )
  const totalAnswered = mockTopicMastery.reduce((s, t) => s + t.questionsAnswered, 0)
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1"
      >
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {profile.name.split(" ")[0]} — ready to forge ahead?
        </h1>
      </motion.div>

      <DailyLimitBanner />

      {/* Primary call to action */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                AI-tailored practice
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              Start a new practice session
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Describe your exam and weak spots — we&apos;ll generate fresh questions
              built just for you.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/intake">
              Start practicing
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Target} label="Mastery" value={`${overallMastery}%`} hint="all topics" />
        <StatCard icon={Brain} label="Answered" value={`${totalAnswered}`} hint="lifetime" />
        <StatCard icon={Timer} label="Streak" value={`${profile.streakDays}d`} hint="keep going" />
        <StatCard
          icon={Sparkles}
          label="Today"
          value={`${profile.questionsUsedToday}/${profile.dailyLimit}`}
          hint="questions"
        />
      </div>

      <MasteryOverview mastery={overallMastery} />

      <div className="grid gap-6 lg:grid-cols-2">
        <WeakTopics topics={mockTopicMastery} />
        <RecentActivity sessions={sessions} />
      </div>
    </div>
  )
}
