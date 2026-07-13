"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlarmClock,
  BookOpen,
  ChevronRight,
  ListChecks,
  Lock,
  RefreshCcw,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { mentorSeedHref, storeMentorSeed } from "@/lib/mentor/seed"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { DomainScore } from "@/lib/session-utils"

interface NextActionsProps {
  sessionId: string
  missedCount: number
  weakest: DomainScore[]
}

interface ActionRow {
  key: string
  href: string
  mentorSeed?: string
  icon: typeof ListChecks
  title: string
  detail: string
}

/**
 * The "so what do I do now" list. Every row is one tap into an existing
 * surface — missed-question review, the lesson for a weak domain, or the
 * full answer review.
 */
export function NextActions({
  sessionId,
  missedCount,
  weakest,
}: NextActionsProps) {
  const router = useRouter()
  const learnTopics = useSessionStore((s) => s.learnTopics)
  const plan = useSessionStore((s) => s.profile.plan)
  const isPaid = plan === "pro" || plan === "exam_pass"
  const [retaking, setRetaking] = useState(false)

  async function startRetake() {
    if (retaking) return
    setRetaking(true)
    try {
      const created = await api.retakeMissed(sessionId)
      // Register before navigating so the runner finds it instantly.
      useSessionStore.setState((state) => ({
        sessions: [created, ...state.sessions],
      }))
      router.push(`/exam/${created.id}`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start the retake",
      )
      setRetaking(false)
    }
  }

  // Lessons covering the weak domains, strongest matches first.
  const weakNames = new Set(weakest.map((d) => d.topic))
  const lessonMatches = learnTopics
    .filter((t) => t.domainName && weakNames.has(t.domainName))
    .slice(0, 2)

  const actions: ActionRow[] = []

  if (missedCount > 0) {
    actions.push({
      key: "missed",
      href: "/practice/review?mode=quiz",
      icon: RefreshCcw,
      title: `Retry your ${missedCount} missed ${missedCount === 1 ? "question" : "questions"}`,
      detail:
        "Already added to your spaced-review queue — clearing it locks the fix in.",
    })

    // Turns the moment of "I got these wrong" into a conversation about why.
    // Seeds the composer only — the user still presses send, so landing here
    // never spends a Mentor message on its own.
    const weakestName = weakest[0]?.topic
    const seed = weakestName
      ? `I just finished a practice exam and missed ${missedCount} ${missedCount === 1 ? "question" : "questions"}, mostly in ${weakestName}. Why do I keep getting ${weakestName} wrong, and how do I recognise the right answer next time?`
      : `I just finished a practice exam and missed ${missedCount} ${missedCount === 1 ? "question" : "questions"}. Help me work out what I'm getting wrong and what to fix first.`

    actions.push({
      key: "mentor",
      href: mentorSeedHref(seed),
      mentorSeed: seed,
      icon: Sparkles,
      title: "Ask Mentor why you missed them",
      detail: weakestName
        ? `Talk through ${weakestName} with a coach that knows your syllabus and your scores.`
        : "Talk it through with a coach that knows your syllabus and your scores.",
    })
  }

  for (const topic of lessonMatches) {
    actions.push({
      key: `lesson-${topic.slug}`,
      href: `/learn/${topic.slug}`,
      icon: BookOpen,
      title: `Learn: ${topic.topic}`,
      detail: `Covers ${topic.domainName} — your weakest area this exam.`,
    })
  }

  actions.push({
    key: "review",
    href: `/history/${sessionId}`,
    icon: ListChecks,
    title: "Review every answer",
    detail: "Explanations, references, and your response for all questions.",
  })

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <p className="text-sm font-medium">What to do next</p>
        <div className="flex flex-col gap-2">
          {missedCount > 0 &&
            (isPaid ? (
              <button
                type="button"
                onClick={() => void startRetake()}
                disabled={retaking}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left transition-colors hover:border-primary/40 disabled:opacity-60"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {retaking ? (
                    <Spinner className="size-4" />
                  ) : (
                    <AlarmClock className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    Retake your misses as a timed exam
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    The {missedCount} you missed, back on the clock — no
                    question quota used.
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ) : (
              <Link
                href="/upgrade"
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <AlarmClock className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    Retake your misses as a timed exam
                    <Lock className="size-3 text-muted-foreground" />
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Pro members re-sit exactly what they missed. Upgrade to
                    unlock.
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.key}
                href={action.href}
                onClick={() => {
                  if (action.mentorSeed) storeMentorSeed(action.mentorSeed)
                }}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:border-primary/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {action.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {action.detail}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
