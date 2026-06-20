"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { AlarmClock, ArrowRight, Brain, Sparkles, Target, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DailyLimitBanner } from "@/components/layout/daily-limit-banner"
import { StatCard } from "@/components/dashboard/stat-card"
import { MasteryOverview } from "@/components/dashboard/mastery-overview"
import { WeakTopics } from "@/components/dashboard/weak-topics"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ContinueSession } from "@/components/dashboard/continue-session"
import { MissedReviewCard } from "@/components/dashboard/missed-review-card"
import { useSessionStore } from "@/lib/store/use-session-store"

export default function DashboardPage() {
  const profile = useSessionStore((s) => s.profile)
  const sessions = useSessionStore((s) => s.sessions)
  const topicMastery = useSessionStore((s) => s.topicMastery)

  const overallMastery = Math.round(
    topicMastery.length > 0
      ? topicMastery.reduce((sum, t) => sum + t.mastery, 0) / topicMastery.length
      : 0,
  )
  const totalAnswered = topicMastery.reduce((s, t) => s + t.questionsAnswered, 0)
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
          {profile.name
            ? `${profile.name.split(" ")[0]} — ready to forge ahead?`
            : "Ready to forge ahead?"}
        </h1>
      </motion.div>

      <DailyLimitBanner />

      <ContinueSession sessions={sessions} />

      {/* Primary calls to action */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  AI-tailored practice
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-balance">
                Start a practice session
              </h2>
              <p className="text-sm text-muted-foreground">
                Describe your exam and weak spots — we&apos;ll generate fresh
                questions with instant feedback.
              </p>
            </div>
            <Button asChild size="lg" className="mt-auto w-full sm:w-fit">
              <Link href="/intake">
                Start practicing
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="flex h-full flex-col gap-4 p-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-primary">
                <AlarmClock className="size-4" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Exam simulation
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-balance">
                Take a timed mock exam
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose your question count and time limit — or auto-generate one
                — and sit it under the clock.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="mt-auto w-full sm:w-fit">
              <Link href="/exam">
                Start an exam
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

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
        <WeakTopics topics={topicMastery} sessions={sessions} />
        <div className="flex flex-col gap-6">
          <MissedReviewCard />
          <RecentActivity sessions={sessions} />
        </div>
      </div>
    </div>
  )
}
