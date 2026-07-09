"use client"

import { Check, X } from "lucide-react"
import type { DragAnswer, Question } from "@/types"
import { normalizeCommand } from "@/lib/db/sessions"
import { cn } from "@/lib/utils"

interface CommandInputPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
  /** Locks the input and shows correct/incorrect feedback. */
  revealed?: boolean
}

/** Typed CLI/config answer with a terminal-style input. */
export function CommandInputPane({
  question,
  answer,
  onChange,
  revealed = false,
}: CommandInputPaneProps) {
  const data = question.dragData
  if (!data || data.type !== "command_input") return null

  const value = answer?.type === "command_input" ? answer.value : ""
  // acceptedAnswers is stripped ([]) during in-progress exams — only judge
  // correctness when the answer key is actually present.
  const accepted = data.acceptedAnswers.filter((a) => a.trim())
  const canJudge = revealed && accepted.length > 0
  const isCorrect =
    canJudge &&
    accepted.map(normalizeCommand).includes(normalizeCommand(value))

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-zinc-950 px-3 py-2.5 font-mono text-sm",
          !revealed && "border-border focus-within:ring-2 focus-within:ring-ring",
          canJudge && isCorrect && "border-success",
          canJudge && !isCorrect && "border-destructive",
        )}
      >
        {data.commandContext && (
          <span className="shrink-0 select-none text-zinc-500">
            {data.commandContext}
          </span>
        )}
        <input
          value={value}
          onChange={(e) => onChange({ type: "command_input", value: e.target.value })}
          disabled={revealed}
          placeholder="type the command…"
          aria-label="Command answer"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent font-mono text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-80"
        />
        {canJudge &&
          (isCorrect ? (
            <Check className="size-4 shrink-0 text-success" />
          ) : (
            <X className="size-4 shrink-0 text-destructive" />
          ))}
      </div>

      {canJudge && !isCorrect && (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Accepted answer{accepted.length > 1 ? "s" : ""}
          </p>
          {accepted.map((a) => (
            <code key={a} className="font-mono text-sm text-success">
              {data.commandContext ? `${data.commandContext} ` : ""}
              {a}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
