"use client"

import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { RotateCcw, Shuffle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Markdown } from "@/components/ui/markdown"
import { Progress } from "@/components/ui/progress"
import { shuffle } from "@/lib/flashcards/build"
import type { ReviewCard } from "@/lib/study/review-deck"

interface FlashcardRoundProps {
  cards: ReviewCard[]
  onRate: (card: ReviewCard, known: boolean) => void
  onComplete?: () => void
}

/**
 * The flip-card review round, shared by every deck (all cards, questions only,
 * facts only, one topic). Owns only the round: which card is showing, whether
 * it's flipped, and what to repeat. Loading, empty states and source/mode
 * chrome belong to the caller.
 */
export function FlashcardRound({
  cards,
  onRate,
  onComplete,
}: FlashcardRoundProps) {
  const [queue, setQueue] = useState<ReviewCard[]>(() => cards)
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [again, setAgain] = useState<ReviewCard[]>([])

  const done = queue.length > 0 && pos >= queue.length
  const current = queue[pos]
  const knownCount = useMemo(
    () => queue.length - again.length,
    [queue.length, again.length],
  )

  function startRound(next: ReviewCard[]) {
    setQueue(shuffle(next))
    setPos(0)
    setFlipped(false)
    setAgain([])
  }

  function rate(known: boolean) {
    if (!current) return
    if (!known) setAgain((a) => [...a, current])
    onRate(current, known)
    if (pos + 1 >= queue.length) onComplete?.()
    setFlipped(false)
    setPos((p) => p + 1)
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">Round complete 🎉</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            You knew {knownCount} of {queue.length}. Cards you missed come back
            tomorrow; the rest wait longer each time.
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
    )
  }

  if (!current) return null

  return (
    <>
      <div className="flex items-center gap-3">
        <Progress value={(pos / queue.length) * 100} className="h-1.5 flex-1" />
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {pos + 1} / {queue.length}
        </span>
        <Button variant="ghost" size="sm" onClick={() => startRound(cards)}>
          <Shuffle data-icon="inline-start" />
          Shuffle
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="min-h-72 w-full text-left"
        aria-label={flipped ? "Show question" : "Reveal answer"}
      >
        <motion.div
          key={`${current.key}-${flipped}`}
          initial={{ opacity: 0, rotateX: flipped ? -8 : 8 }}
          animate={{ opacity: 1, rotateX: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Card
            className={flipped ? "border-primary/40 bg-primary/5" : "border-border"}
          >
            <CardContent className="flex min-h-72 flex-col gap-3 p-6">
              <span className="flex items-center justify-between gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className="truncate">{current.topic}</span>
                <span className="shrink-0">
                  {flipped ? "Answer" : current.kind === "fact" ? "Fact" : "Question"}
                </span>
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
}
