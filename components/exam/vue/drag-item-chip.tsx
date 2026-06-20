"use client"

import { cn } from "@/lib/utils"

interface DragItemChipProps {
  label: string
  selected?: boolean
  assigned?: boolean
  onClick?: () => void
  className?: string
}

export function DragItemChip({
  label,
  selected,
  assigned,
  onClick,
  className,
}: DragItemChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-2 text-left text-sm transition-colors",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : assigned
            ? "border-border bg-secondary/60 text-foreground"
            : "border-border bg-background text-foreground hover:border-primary/40",
        className,
      )}
    >
      {label}
    </button>
  )
}
