"use client"

import { Suspense } from "react"
import { ReviewDeck } from "@/components/study/review-deck"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { getCatalogTopicBySlug } from "@/lib/learning/catalog"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * The topic-bound review deck.
 *
 * Key facts are stored per lesson, so they narrow to this exact topic. Missed
 * questions are only tagged with their exam domain — the generator never records
 * a finer topic — so they can only narrow to the domain this topic sits in. The
 * scope note says so rather than implying a precision that isn't there.
 */
export function TopicReview({ topicSlug }: { topicSlug: string }) {
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const catalogTopic = getCatalogTopicBySlug(activeExamCode ?? "", topicSlug)

  const scopeNote = catalogTopic
    ? `Key facts from this lesson · misses from ${catalogTopic.domainName}`
    : "Key facts from this lesson"

  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReviewDeck
        topicSlug={topicSlug}
        domainId={catalogTopic?.domainId}
        scopeNote={scopeNote}
      />
    </Suspense>
  )
}
