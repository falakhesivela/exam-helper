import type { ReactNode } from "react"
import { TopicShell } from "@/components/study/topic-shell"

export default async function TopicLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ topicSlug: string }>
}) {
  const { topicSlug } = await params
  return <TopicShell topicSlug={topicSlug}>{children}</TopicShell>
}
