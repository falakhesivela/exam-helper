import { TopicLessonView } from "@/components/study/topic-lesson"

interface LessonPageProps {
  params: Promise<{ topicSlug: string }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { topicSlug } = await params
  return <TopicLessonView topicSlug={topicSlug} />
}
