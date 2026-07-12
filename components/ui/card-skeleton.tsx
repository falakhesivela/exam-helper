import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Placeholder card shown while the store's bulk data (sessions, mastery,
 * plan…) is still streaming in after the shell rendered. Prevents empty-state
 * CTAs ("No sessions yet", "Build your plan") from flashing before real data
 * arrives.
 */
export function CardSkeleton({
  rows = 3,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-3 p-6">
        <Skeleton className="h-5 w-2/5" />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton
            key={i}
            className={cn("h-4", i % 2 === 0 ? "w-full" : "w-3/4")}
          />
        ))}
      </CardContent>
    </Card>
  )
}
