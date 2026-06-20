import { Suspense } from "react"
import { MissedReview } from "@/components/practice/missed-review"
import { LoadingScreen } from "@/components/ui/loading-screen"

export default function MissedPracticePage() {
  return (
    <div className="py-4">
      <Suspense fallback={<LoadingScreen message="Loading…" />}>
        <MissedReview />
      </Suspense>
    </div>
  )
}
