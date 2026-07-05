import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  /** Progress 0–100. */
  value: number
  /** Rendered diameter in px. */
  size?: number
  strokeWidth?: number
  /** Stroke color of the progress arc (any CSS color). */
  color?: string
  trackColor?: string
  /** Optional marker (e.g. an exam pass mark) at this 0–100 position. */
  tickAt?: number
  className?: string
  /** Centered content (score, label, …). */
  children?: ReactNode
}

/** Circular progress indicator shared by the readiness and goal rings. */
export function ProgressRing({
  value,
  size = 144,
  strokeWidth = 10,
  color = "var(--primary)",
  trackColor = "var(--muted)",
  tickAt,
  className,
  children,
}: ProgressRingProps) {
  const radius = (120 - strokeWidth - 6) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        {tickAt != null && (
          <line
            x1={60 + radius - strokeWidth / 2 - 2}
            y1="60"
            x2={60 + radius + strokeWidth / 2 + 2}
            y2="60"
            stroke="var(--foreground)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.9"
            transform={`rotate(${(Math.min(100, Math.max(0, tickAt)) / 100) * 360} 60 60)`}
          />
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}
