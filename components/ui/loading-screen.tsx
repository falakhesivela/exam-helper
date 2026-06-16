import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  message?: string
  className?: string
}

/** Centered full-area loading state with spinner and optional message. */
export function LoadingScreen({
  message = "Loading…",
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center gap-3 text-muted-foreground",
        className,
      )}
    >
      <Spinner className="size-6" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
