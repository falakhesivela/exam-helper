import { cn } from "@/lib/utils"

interface ThinkingIndicatorProps {
  /** Announced to screen readers, which get no benefit from the dots. */
  label?: string
  className?: string
}

/**
 * The "assistant is composing" state for chat threads.
 *
 * Deliberately shaped like an assistant bubble rather than a spinner: the reply
 * then streams into the same spot, so the bubble fills rather than being swapped
 * out. A spinner reads as "the page is loading"; this reads as "someone is
 * replying".
 */
export function ThinkingIndicator({ label, className }: ThinkingIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex w-fit max-w-[85%] items-center gap-1.5 self-start rounded-xl bg-card px-3.5 py-3",
        className,
      )}
    >
      <span className="sr-only">{label ?? "Generating a reply"}</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="animate-thinking-dot size-1.5 rounded-full bg-primary"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  )
}
