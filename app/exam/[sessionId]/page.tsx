import { ExamRunner } from "@/components/exam/exam-runner"

// The exam lives outside the main app shell so it's fully full-screen and
// distraction-free (no top bar or bottom navigation) — like the real thing.
export default async function ExamSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <ExamRunner sessionId={sessionId} />
}
