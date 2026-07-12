"use client"

import Link from "next/link"
import { ArrowRight, Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface LessonActionsProps {
  topicName: string
  status: "not-started" | "started" | "completed"
  bookmarked: boolean
  lessonId?: string
  onMarkComplete: () => void
  onToggleBookmark: () => void
  completing: boolean
}

/** Lesson footer actions: complete, bookmark, practice CTA. */
export function LessonActions({
  topicName,
  status,
  bookmarked,
  onMarkComplete,
  onToggleBookmark,
  completing,
}: LessonActionsProps) {
  const practiceHref = `/intake?topic=${encodeURIComponent(topicName)}`

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        {status !== "completed" && (
          <Button
            variant="secondary"
            onClick={onMarkComplete}
            disabled={completing}
          >
            {completing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <CheckCircle2 data-icon="inline-start" />
            )}
            {completing ? "Saving…" : "Mark complete"}
          </Button>
        )}
        <Button variant="outline" onClick={onToggleBookmark} disabled={completing}>
          {completing ? (
            <Spinner data-icon="inline-start" />
          ) : bookmarked ? (
            <BookmarkCheck data-icon="inline-start" />
          ) : (
            <Bookmark data-icon="inline-start" />
          )}
          {completing ? "Saving…" : bookmarked ? "Bookmarked" : "Bookmark"}
        </Button>
      </div>
      <Button asChild size="lg" className="w-full">
        <Link href={practiceHref}>
          Practice this topic
          <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </div>
  )
}
