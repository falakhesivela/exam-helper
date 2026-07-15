import { PracticeHub } from "@/components/practice/practice-hub"

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>
}) {
  const { topic } = await searchParams
  return <PracticeHub initialTopic={topic} />
}
