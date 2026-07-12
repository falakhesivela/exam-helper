import { TopicLabView } from "@/components/study/topic-lab"

export default async function TopicLabPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>
}) {
  const { topicSlug } = await params
  return <TopicLabView topicSlug={topicSlug} />
}
