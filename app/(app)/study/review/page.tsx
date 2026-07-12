import { Suspense } from "react"
import { ReviewDeck } from "@/components/study/review-deck"
import { LoadingScreen } from "@/components/ui/loading-screen"

export default function ReviewPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReviewDeck />
    </Suspense>
  )
}
