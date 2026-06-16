import { QuizRunner } from "@/components/quiz/quiz-runner"

// The quiz lives outside the main app shell so it can be fully full-screen and
// distraction-free (no top bar or bottom navigation).
export default async function QuizPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <QuizRunner sessionId={sessionId} />
}
