import { SessionReview } from "@/components/history/session-review"

export default async function HistoryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ filter?: string }>
}) {
  const { sessionId } = await params
  const { filter } = await searchParams
  const reviewFilter = filter === "flagged" ? "flagged" : "all"

  return <SessionReview sessionId={sessionId} filter={reviewFilter} />
}
