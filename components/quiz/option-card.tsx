"use client"

import { Check, X } from "lucide-react"
import { motion } from "motion/react"
import type { QuestionOption } from "@/types"
import { cn } from "@/lib/utils"

interface OptionCardProps {
  option: QuestionOption
  index: number
  selected: boolean
  /** Whether the user has submitted their answer (reveals correctness). */
  revealed: boolean
  isCorrect: boolean
  multiSelect: boolean
  disabled: boolean
  onToggle: () => void
}

const LETTERS = ["A", "B", "C", "D", "E", "F"]

/**
 * Large, touch-friendly answer card. Animates and color-codes once the answer
 * is revealed (green correct / red incorrect).
 */
export function OptionCard({
  option,
  index,
  selected,
  revealed,
  isCorrect,
  multiSelect,
  disabled,
  onToggle,
}: OptionCardProps) {
  // Determine visual state.
  const showCorrect = revealed && isCorrect
  const showWrong = revealed && selected && !isCorrect

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      animate={showWrong ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
      transition={{ duration: 0.35 }}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors",
        "disabled:cursor-default",
        !revealed && selected && "border-primary bg-primary/10",
        !revealed && !selected && "border-border bg-card hover:border-primary/40",
        showCorrect && "border-success bg-success/12",
        showWrong && "border-destructive bg-destructive/12",
        revealed && !showCorrect && !showWrong && "border-border bg-card opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
          multiSelect && !revealed && "rounded-lg",
          !revealed && selected && "bg-primary text-primary-foreground",
          !revealed && !selected && "bg-secondary text-muted-foreground",
          showCorrect && "bg-success text-success-foreground",
          showWrong && "bg-destructive text-destructive-foreground",
          revealed && !showCorrect && !showWrong && "bg-secondary text-muted-foreground",
        )}
      >
        {showCorrect ? (
          <Check className="size-4.5" />
        ) : showWrong ? (
          <X className="size-4.5" />
        ) : (
          LETTERS[index]
        )}
      </span>
      <span className="flex-1 text-[15px] leading-relaxed">{option.text}</span>
    </motion.button>
  )
}
