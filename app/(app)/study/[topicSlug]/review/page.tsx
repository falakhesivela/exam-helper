import { TopicReview } from "@/components/study/topic-review"

export default async function TopicReviewPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>
}) {
  const { topicSlug } = await params
  return <TopicReview topicSlug={topicSlug} />
}
