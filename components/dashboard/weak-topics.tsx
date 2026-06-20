"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Sparkles, Target, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { PracticeSession, TopicMastery } from "@/types"
import { resolveTopicName, inferExamFromSessions } from "@/lib/learning/topic-resolver"
import {
  getExamBlueprint,
  mapWeakTopicsToDomains,
  parseMasteryTopicKey,
  scaledExamParams,
  WEAK_FOCUS_EXAM_MINUTES,
  WEAK_FOCUS_EXAM_QUESTIONS,
  WEAK_FOCUS_PRACTICE_QUESTIONS,
} from "@/lib/exams"
import { useGenerationStore } from "@/lib/generation/session-generation"
import { useSessionStore } from "@/lib/store/use-session-store"
import { ApiClientError } from "@/lib/api/client"

interface WeakTopicsProps {
  topics: TopicMastery[]
  sessions: PracticeSession[]
}

/** Lists weak topics with links to learn or launch a focused mock exam. */
export function WeakTopics({ topics, sessions }: WeakTopicsProps) {
  const router = useRouter()
  const remaining = useSessionStore((s) => s.remainingFreeQuestions())
  const hydrate = useSessionStore((s) => s.hydrate)
  const isPro = remaining === Infinity
  const [startingExam, setStartingExam] = useState(false)
  const [startingPractice, setStartingPractice] = useState(false)

  const { examCode, exam } = useMemo(
    () => inferExamFromSessions(sessions),
    [sessions],
  )
  const blueprint = getExamBlueprint(examCode)
  const relevantTopics = useMemo(() => {
    if (!blueprint) return topics
    return topics.filter((t) => {
      const parsed = parseMasteryTopicKey(t.topic)
      if (!parsed) return true
      return parsed.examCode.toUpperCase() === blueprint.examCode.toUpperCase()
    })
  }, [topics, blueprint])
  const weakest = [...relevantTopics]
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3)

  const focusDomains = useMemo(() => {
    if (!blueprint || weakest.length === 0) return []
    return mapWeakTopicsToDomains(
      blueprint,
      weakest.map((t) => t.topic),
    )
  }, [blueprint, weakest])

  const launchParams = useMemo(() => {
    if (!blueprint) return null
    const questionCount = isPro
      ? WEAK_FOCUS_EXAM_QUESTIONS
      : Math.min(WEAK_FOCUS_EXAM_QUESTIONS, remaining)
    if (questionCount < 1) return null
    const scaled = scaledExamParams(blueprint, questionCount)
    return {
      questionCount: scaled.questionCount,
      durationSec: (isPro ? WEAK_FOCUS_EXAM_MINUTES : scaled.durationMin) * 60,
      focusDomainIds: focusDomains.map((d) => d.id),
    }
  }, [blueprint, focusDomains, isPro, remaining])

  const practiceParams = useMemo(() => {
    if (!blueprint || focusDomains.length === 0) return null
    const questionCount = isPro
      ? WEAK_FOCUS_PRACTICE_QUESTIONS
      : Math.min(WEAK_FOCUS_PRACTICE_QUESTIONS, remaining)
    if (questionCount < 1) return null
    const topicLabels = focusDomains.map((d) => d.name)
    return {
      questionCount,
      description: `Focused practice for ${blueprint.exam} (${blueprint.examCode}). Target my weak areas: ${topicLabels.join(", ")}. Generate exam-style multiple-choice questions on these domains only.`,
      focusTopics: topicLabels,
    }
  }, [blueprint, focusDomains, isPro, remaining])

  async function startWeakExam() {
    if (!blueprint || !launchParams || startingExam) return
    setStartingExam(true)
    try {
      useGenerationStore.getState().startExamGeneration(
        {
          questionCount: launchParams.questionCount,
          durationSec: launchParams.durationSec,
          exam: blueprint.exam,
          examCode: blueprint.examCode,
          focusDomainIds: launchParams.focusDomainIds,
        },
        {
          onReady: (session) => {
            toast.success("Focused mock exam ready!")
            router.push(`/exam/${session.id}`)
            setStartingExam(false)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            if (err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT") {
              toast.error("Daily question limit reached.")
            } else {
              toast.error(err.message)
            }
            setStartingExam(false)
          },
        },
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start exam")
      setStartingExam(false)
    }
  }

  async function startWeakPractice() {
    if (!blueprint || !practiceParams || startingPractice) return
    setStartingPractice(true)
    try {
      useGenerationStore.getState().startPracticeGeneration(
        {
          description: practiceParams.description,
          count: practiceParams.questionCount,
          focusTopics: practiceParams.focusTopics,
          exam: blueprint.exam,
          examCode: blueprint.examCode,
        },
        {
          onReady: (session) => {
            toast.success("Weak-area practice ready!")
            router.push(`/quiz/${session.id}`)
            setStartingPractice(false)
          },
          onDone: async () => {
            await hydrate()
          },
          onError: (err) => {
            if (err instanceof ApiClientError && err.code === "FREEMIUM_LIMIT") {
              toast.error("Daily question limit reached.")
            } else {
              toast.error(err.message)
            }
            setStartingPractice(false)
          },
        },
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not start practice",
      )
      setStartingPractice(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          Focus areas
        </CardTitle>
        <CardDescription>
          Recommended topics to strengthen next
          {blueprint ? ` · ${examCode}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {weakest.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Answer more questions to see personalized focus areas.
          </p>
        ) : (
          weakest.map((t) => {
            const label = t.displayTopic ?? t.topic
            const resolved = resolveTopicName(label, examCode)
            return (
              <Link
                key={t.topic}
                href={`/learn/${resolved.slug}`}
                className="-mx-2 flex flex-col gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">{t.mastery}%</span>
                </div>
                <Progress value={t.mastery} className="h-1.5" />
              </Link>
            )
          })
        )}

        {blueprint && focusDomains.length > 0 && practiceParams && (
          <Button
            className="w-full"
            variant="default"
            disabled={startingPractice || startingExam}
            onClick={() => void startWeakPractice()}
          >
            {startingPractice ? (
              <>
                <Spinner data-icon="inline-start" />
                Starting practice…
              </>
            ) : (
              <>
                <Sparkles data-icon="inline-start" />
                Practice weak areas ({practiceParams.questionCount} Q)
              </>
            )}
          </Button>
        )}

        {blueprint && focusDomains.length > 0 && launchParams && (
          <Button
            className="w-full"
            variant="secondary"
            disabled={startingExam || startingPractice}
            onClick={() => void startWeakExam()}
          >
            {startingExam ? (
              <>
                <Spinner data-icon="inline-start" />
                Starting exam…
              </>
            ) : (
              <>
                <Target data-icon="inline-start" />
                Mock exam on weak areas ({launchParams.questionCount} Q)
              </>
            )}
          </Button>
        )}

        <Button asChild variant="outline" className="w-full">
          <Link href="/learn">
            Go to Learning
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <Link
          href="/intake"
          className="text-center text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
        >
          Custom practice session
        </Link>
      </CardContent>
    </Card>
  )
}
