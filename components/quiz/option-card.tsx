"use client"

import { Ban, Check, Undo2, X } from "lucide-react"
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
  /** Struck out by the learner while reasoning through the options. */
  eliminated?: boolean
  /** When provided, shows the rule-out control (hidden once revealed). */
  onToggleEliminated?: () => void
}

const LETTERS = ["A", "B", "C", "D", "E", "F"]

/**
 * Large, touch-friendly answer card. Animates and color-codes once the answer
 * is revealed (green correct / red incorrect). Supports striking out options
 * to narrow down the choices before answering.
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
  eliminated = false,
  onToggleEliminated,
}: OptionCardProps) {
  // Determine visual state.
  const showCorrect = revealed && isCorrect
  const showWrong = revealed && selected && !isCorrect
  const showEliminate = onToggleEliminated != null && !revealed

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        animate={
          showWrong
            ? { x: [0, -6, 6, -4, 4, 0] }
            : showCorrect
              ? { scale: [1, 1.02, 1] }
              : undefined
        }
        // Keyframe animations must use a tween — motion throws on springs with
        // more than two keyframes, which kills every queued animation on the
        // page (including the explanation panel's reveal).
        transition={{ duration: 0.35, ease: "easeOut" }}
        aria-pressed={selected}
        className={cn(
          "flex w-full items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors",
          "disabled:cursor-default",
          showEliminate && "pr-12",
          !revealed && selected && "border-primary bg-primary/10",
          !revealed && !selected && "border-border bg-card hover:border-primary/40",
          !revealed && eliminated && "opacity-45",
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
        <span
          className={cn(
            "flex-1 text-[15px] leading-relaxed",
            !revealed && eliminated && "text-muted-foreground line-through",
          )}
        >
          {option.text}
        </span>
      </motion.button>

      {showEliminate && (
        <button
          type="button"
          aria-label={
            eliminated
              ? `Restore option ${LETTERS[index]}`
              : `Rule out option ${LETTERS[index]}`
          }
          aria-pressed={eliminated}
          onClick={onToggleEliminated}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 transition-colors",
            eliminated
              ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
              : "text-muted-foreground/40 hover:bg-secondary hover:text-foreground",
          )}
        >
          {eliminated ? (
            <Undo2 className="size-4" />
          ) : (
            <Ban className="size-4" />
          )}
        </button>
      )}
    </div>
  )
}
