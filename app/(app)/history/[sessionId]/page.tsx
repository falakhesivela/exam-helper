import { SessionReview } from "@/components/history/session-review"

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <SessionReview sessionId={sessionId} />
}
