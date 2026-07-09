"use client"

import type { QuestionOption } from "@/types"
import { MarkdownInline } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"

const LETTERS = ["A", "B", "C", "D", "E", "F"]

interface ExamOptionRowProps {
  option: QuestionOption
  index: number
  selected: boolean
  multiSelect: boolean
  onToggle: () => void
}

/**
 * Flat exam-style answer row (distinct from practice OptionCard).
 * Touch-friendly but visually calm — no animations or feedback colors.
 */
export function ExamOptionRow({
  option,
  index,
  selected,
  multiSelect,
  onToggle,
}: ExamOptionRowProps) {
  const letter = LETTERS[index] ?? String(index + 1)

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 border px-4 py-3 text-left transition-colors",
        "first:rounded-t-md last:rounded-b-md",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border text-xs font-semibold",
          multiSelect ? "rounded-sm" : "rounded-full",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 text-muted-foreground",
        )}
        aria-hidden
      >
        {multiSelect && selected ? "✓" : letter}
      </span>
      <span className="flex-1 text-[15px] leading-relaxed">
        <span className="font-medium">{letter}.</span>{" "}
        <MarkdownInline>{option.text}</MarkdownInline>
      </span>
    </button>
  )
}
