"use client"

import { ArrowDown, ArrowUp, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DragAnswer, Question } from "@/types"
import { cn } from "@/lib/utils"

interface DragOrderPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
  /** Locks interaction and shows position feedback + the correct order. */
  revealed?: boolean
}

export function DragOrderPane({
  question,
  answer,
  onChange,
  revealed = false,
}: DragOrderPaneProps) {
  const data = question.dragData
  if (!data || data.type !== "drag_order") return null

  const order =
    answer?.type === "drag_order" && answer.order.length > 0
      ? answer.order
      : data.items.map((item) => item.id)

  const rows = order
    .map((id) => data.items.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const anyWrong =
    revealed && rows.some((item, index) => data.correctOrder[index] !== item.id)

  function move(index: number, direction: -1 | 1) {
    const next = [...order]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ type: "drag_order", order: next })
  }

  return (
    <div className="flex flex-col gap-5">
      {!revealed && (
        <p className="text-sm text-muted-foreground">
          Put the steps in the correct order using the arrows.
        </p>
      )}
      <div className="flex flex-col gap-2">
        {rows.map((item, index) => {
          const isCorrect = revealed && data.correctOrder[index] === item.id
          const isWrong = revealed && !isCorrect
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2",
                revealed
                  ? isCorrect
                    ? "border-success/50 bg-success/10"
                    : "border-destructive/50 bg-destructive/10"
                  : "border-border bg-background",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  isCorrect
                    ? "bg-success text-success-foreground"
                    : isWrong
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted",
                )}
              >
                {isCorrect ? (
                  <Check className="size-3.5" />
                ) : isWrong ? (
                  <X className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <p className="flex-1 text-sm">{item.text}</p>
              {!revealed && (
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    aria-label="Move up"
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === rows.length - 1}
                    aria-label="Move down"
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {anyWrong && (
        <div className="rounded-md border border-success/40 bg-success/5 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-success">
            Correct order
          </p>
          <ol className="flex flex-col gap-1.5">
            {data.correctOrder.map((id, i) => {
              const item = data.items.find((it) => it.id === id)
              if (!item) return null
              return (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-[11px] font-semibold text-success">
                    {i + 1}
                  </span>
                  {item.text}
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}
