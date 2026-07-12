import { TopicDrill } from "@/components/study/topic-drill"

export default async function TopicDrillPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>
}) {
  const { topicSlug } = await params
  return <TopicDrill topicSlug={topicSlug} />
}
