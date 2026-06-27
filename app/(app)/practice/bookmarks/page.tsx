"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bookmark, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api/client"
import { useSessionStore } from "@/lib/store/use-session-store"
import { questionStemText } from "@/lib/question-stem"
import type { Bookmark as BookmarkType } from "@/types"

export default function BookmarksPage() {
  const [items, setItems] = useState<BookmarkType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const toggleBookmark = useSessionStore((s) => s.toggleBookmark)

  useEffect(() => {
    let cancelled = false
    api
      .bookmarks()
      .then((res) => !cancelled && setItems(res.items))
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Couldn't load bookmarks")
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  function remove(questionId: string) {
    setItems((prev) => prev.filter((b) => b.questionId !== questionId))
    void toggleBookmark(questionId)
  }

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft data-icon="inline-start" />
            Dashboard
          </Link>
        </Button>
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Bookmark className="size-4 text-primary" />
          Saved questions
        </p>
        <span className="w-20" />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Bookmark className="size-8 text-primary" />
          <h1 className="text-xl font-semibold">No saved questions</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap <span className="font-medium text-foreground">Save</span> on any
            question&apos;s explanation to keep it here for later review.
          </p>
          <Button asChild>
            <Link href="/intake">Start practicing</Link>
          </Button>
        </div>
      ) : (
        items.map((b) => {
          const q = b.question
          const correctTexts = (q.options ?? [])
            .filter((o) => (q.correctOptionIds ?? []).includes(o.id))
            .map((o) => o.text)
          return (
            <Card key={b.questionId}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{q.topic}</Badge>
                    {b.examCode && (
                      <span className="text-xs text-muted-foreground">
                        {b.examCode}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove bookmark"
                    onClick={() => remove(b.questionId)}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <p className="text-sm font-medium">{questionStemText(q)}</p>

                {correctTexts.length > 0 && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                    {correctTexts.map((t) => (
                      <p key={t} className="text-primary">
                        ✓ {t}
                      </p>
                    ))}
                  </div>
                )}

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {q.explanation}
                </p>

                {q.references.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                    {q.references.map((ref) => (
                      <a
                        key={ref.url}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3.5" />
                        {ref.label}
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
