import {
  SessionReview,
  type ReviewFilter,
} from "@/components/history/session-review"

const FILTERS: ReviewFilter[] = ["all", "flagged", "incorrect", "unsure"]

export default async function HistoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { sessionId } = await params
  const { filter } = await searchParams
  const reviewFilter = FILTERS.includes(filter as ReviewFilter)
    ? (filter as ReviewFilter)
    : "all"

  return <SessionReview sessionId={sessionId} filter={reviewFilter} />
}
