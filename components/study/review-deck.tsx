"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Layers, Lightbulb, ListChecks } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { FlashcardRound } from "@/components/study/flashcard-round"
import { MissedQuiz } from "@/components/study/missed-quiz"
import { api } from "@/lib/api/client"
import { buildReviewDeck, rateTarget, type ReviewCard } from "@/lib/study/review-deck"
import { useSessionStore } from "@/lib/store/use-session-store"
import type { ReviewSource } from "@/types"
import { cn } from "@/lib/utils"

type Mode = "cards" | "quiz"

const SOURCES: { value: ReviewSource; label: string }[] = [
  { value: "all", label: "All" },
  { value: "questions", label: "Questions" },
  { value: "facts", label: "Facts" },
]

interface ReviewDeckProps {
  /** Bind the deck to one topic (its facts) and its domain (their questions). */
  topicSlug?: string
  domainId?: string
  /** Shown above the deck when it is scoped to a topic. */
  scopeNote?: string
}

/**
 * One review surface over both spaced-repetition sources. Cards mode is the
 * quick flip deck; Quiz mode is the full question with explanation and tutor.
 */
export function ReviewDeck({ topicSlug, domainId, scopeNote }: ReviewDeckProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const dueOnly = searchParams.get("due") === "true"
  const mode: Mode = searchParams.get("mode") === "quiz" ? "quiz" : "cards"
  const sourceParam = searchParams.get("source")
  const source: ReviewSource =
    sourceParam === "questions" || sourceParam === "facts" ? sourceParam : "all"

  // Set when opened from a study-plan task; finishing the round completes it.
  const planTaskId = searchParams.get("planTask")
  const updatePlanTask = useSessionStore((s) => s.updatePlanTask)

  const [cards, setCards] = useState<ReviewCard[] | null>(null)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    // Quiz mode has its own loader (it needs the full question, not a card).
    if (mode === "quiz") return
    let cancelled = false
    setCards(null)
    api
      .reviewQueue({ dueOnly, source, topicSlug, domainId })
      .then((queue) => {
        if (cancelled) return
        const deck = buildReviewDeck(queue)
        setCards(deck)
        setDueCount(queue.dueCount)
        if (planTaskId && deck.length === 0) {
          void updatePlanTask(planTaskId, { status: "done" })
        }
      })
      .catch(() => !cancelled && setCards([]))
    return () => {
      cancelled = true
    }
  }, [mode, dueOnly, source, topicSlug, domainId, planTaskId, updatePlanTask])

  /** Replace one query param, keeping the rest of the URL intact. */
  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString())
      if (value === null) next.delete(key)
      else next.set(key, value)
      router.replace(`?${next.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const onRate = useCallback((card: ReviewCard, known: boolean) => {
    void api.rateReviewCard(rateTarget(card), known)
  }, [])

  const header = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Review</h1>
          {scopeNote && (
            <p className="text-sm text-muted-foreground text-pretty">{scopeNote}</p>
          )}
        </div>
        {dueCount > 0 && (
          <Badge variant="secondary" className="tabular-nums">
            {dueCount} due today
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Review source"
        >
          {SOURCES.map((s) => (
            <button
              key={s.value}
              type="button"
              // Quiz mode can only show questions — facts have no options to pick.
              disabled={mode === "quiz" && s.value !== "questions"}
              onClick={() => setParam("source", s.value === "all" ? null : s.value)}
              aria-pressed={source === s.value}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-40",
                source === s.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <Button
            size="sm"
            variant={mode === "cards" ? "secondary" : "ghost"}
            onClick={() => setParam("mode", null)}
          >
            <Layers data-icon="inline-start" />
            Cards
          </Button>
          <Button
            size="sm"
            variant={mode === "quiz" ? "secondary" : "ghost"}
            onClick={() => setParam("mode", "quiz")}
          >
            <ListChecks data-icon="inline-start" />
            Quiz
          </Button>
        </div>
      </div>
    </div>
  )

  const emptyMessage = useMemo(() => {
    if (dueOnly) return "Nothing due right now. Come back tomorrow."
    if (source === "facts")
      return "Key facts come from your AI lessons. Generate a lesson and its facts show up here."
    if (source === "questions")
      return "Questions you miss in practice show up here to review."
    return "Nothing to review yet. Miss a question or generate a lesson, and it lands here."
  }, [dueOnly, source])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      {header}

      {mode === "quiz" ? (
        <MissedQuiz domainId={domainId} />
      ) : cards === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-6" />
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <Lightbulb className="size-8 text-primary" />
            <p className="max-w-sm text-sm text-muted-foreground text-pretty">
              {emptyMessage}
            </p>
            <Button asChild variant="secondary">
              <Link href="/study">Back to Study</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Remount on deck identity so a source/scope switch starts a fresh round.
        <FlashcardRound
          key={`${source}-${dueOnly}-${topicSlug ?? ""}`}
          cards={cards}
          onRate={onRate}
        />
      )}
    </div>
  )
}
