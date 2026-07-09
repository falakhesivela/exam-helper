"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { RotateCcw, Shuffle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PracticeHeader } from "@/components/practice/practice-header"
import { Card, CardContent } from "@/components/ui/card"
import { Markdown } from "@/components/ui/markdown"
import { Spinner } from "@/components/ui/spinner"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api/client"
import { shuffle, toFlashcard, type Flashcard } from "@/lib/flashcards/build"

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Current round state.
  const [queue, setQueue] = useState<Flashcard[]>([])
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [again, setAgain] = useState<Flashcard[]>([])

  useEffect(() => {
    let cancelled = false
    api
      .missedQuestions()
      .then((res) => {
        if (cancelled) return
        const built = res.items.map(toFlashcard)
        setCards(built)
        setQueue(shuffle(built))
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

  function startRound(next: Flashcard[]) {
    setQueue(shuffle(next))
    setPos(0)
    setFlipped(false)
    setAgain([])
  }

  function rate(known: boolean) {
    if (!current) return
    if (!known) setAgain((a) => [...a, current])
    void api.rateFlashcard(current.id, known)
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
        <Sparkles className="size-8 text-primary" />
        <h1 className="text-xl font-semibold">No flashcards yet</h1>
        <p className="text-sm text-muted-foreground">
          Flashcards are built from questions you&apos;ve missed. Take a practice
          session or mock exam, and your misses will show up here to review.
        </p>
        <Button asChild>
          <Link href="/practice">Back to Practice</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PracticeHeader
        title="Flashcards"
        action={
          <Button variant="ghost" size="sm" onClick={() => startRound(cards)}>
            <Shuffle data-icon="inline-start" />
            Shuffle
          </Button>
        }
      />

      {done ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <h2 className="text-xl font-semibold">Round complete 🎉</h2>
            <p className="text-sm text-muted-foreground">
              You knew {knownCount} of {queue.length}.
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
                key={`${current.id}-${flipped}`}
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
                      <span>{current.topic}</span>
                      <span>{flipped ? "Answer" : "Question"}</span>
                    </span>
                    <Markdown className="flex-1 text-base leading-relaxed">
                      {flipped ? current.back : current.front}
                    </Markdown>
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
