"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowLeft, Lightbulb, RotateCcw, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api/client"
import { shuffle } from "@/lib/flashcards/build"
import type { FactCard } from "@/types"

function cardKey(c: FactCard) {
  return `${c.lessonId}:${c.factIndex}`
}

export default function FactCardsPage() {
  const [cards, setCards] = useState<FactCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Current round state.
  const [queue, setQueue] = useState<FactCard[]>([])
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [again, setAgain] = useState<FactCard[]>([])

  useEffect(() => {
    let cancelled = false
    api
      .factCards()
      .then((res) => {
        if (cancelled) return
        // Due cards first so short sessions hit what matters.
        const ordered = [
          ...shuffle(res.items.filter((c) => c.due)),
          ...shuffle(res.items.filter((c) => !c.due)),
        ]
        setCards(ordered)
        setQueue(ordered)
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Couldn't load cards")
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const done = queue.length > 0 && pos >= queue.length
  const current = queue[pos]

  function startRound(next: FactCard[]) {
    setQueue(shuffle(next))
    setPos(0)
    setFlipped(false)
    setAgain([])
  }

  function rate(known: boolean) {
    if (!current) return
    if (!known) setAgain((a) => [...a, current])
    void api.rateFact(current.lessonId, current.factIndex, known)
    setFlipped(false)
    setPos((p) => p + 1)
  }

  const knownCount = useMemo(
    () => queue.length - again.length,
    [queue.length, again.length],
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (error) {
    return <p className="py-20 text-center text-sm text-muted-foreground">{error}</p>
  }

  if (cards.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <Lightbulb className="size-8 text-primary" />
        <h1 className="text-xl font-semibold">No key facts yet</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Key-fact flashcards come from your AI lessons. Generate a lesson in
          Learn and its facts will show up here for spaced review.
        </p>
        <Button asChild>
          <Link href="/learn">Back to Learning</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/learn"
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Learning
        </Link>
        <Button variant="ghost" size="sm" onClick={() => startRound(cards)}>
          <Shuffle data-icon="inline-start" />
          Shuffle
        </Button>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">Key facts</h1>

      {done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <h2 className="text-xl font-semibold">Round complete 🎉</h2>
            <p className="text-sm text-muted-foreground">
              You knew {knownCount} of {queue.length}. Facts you missed come
              back tomorrow; the rest wait longer each time.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {again.length > 0 && (
                <Button onClick={() => startRound(again)}>
                  <RotateCcw data-icon="inline-start" />
                  Review {again.length} again
                </Button>
              )}
              <Button variant="secondary" onClick={() => startRound(cards)}>
                <Shuffle data-icon="inline-start" />
                Restart all ({cards.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        current && (
          <>
            <Progress value={(pos / queue.length) * 100} className="h-1.5" />
            <p className="text-center text-xs text-muted-foreground">
              {pos + 1} of {queue.length}
            </p>

            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className="min-h-72 w-full text-left"
              aria-label={flipped ? "Show question" : "Reveal answer"}
            >
              <motion.div
                key={`${cardKey(current)}-${flipped}`}
                initial={{ opacity: 0, rotateX: flipped ? -8 : 8 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Card
                  className={
                    flipped ? "border-primary/40 bg-primary/5" : "border-border"
                  }
                >
                  <CardContent className="flex min-h-72 flex-col gap-3 p-6">
                    <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <span>{current.topicName}</span>
                      <span>{flipped ? "Answer" : "Question"}</span>
                    </span>
                    <p className="flex-1 whitespace-pre-line text-base leading-relaxed">
                      {flipped ? current.fact : current.question}
                    </p>
                    {!flipped && (
                      <span className="text-center text-xs text-muted-foreground">
                        Tap to reveal answer
                      </span>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </button>

            {flipped ? (
              <div className="flex gap-2.5">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => rate(false)}
                >
                  Still learning
                </Button>
                <Button className="flex-1" onClick={() => rate(true)}>
                  Got it
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setFlipped(true)}>
                Reveal answer
              </Button>
            )}
          </>
        )
      )}
    </div>
  )
}
