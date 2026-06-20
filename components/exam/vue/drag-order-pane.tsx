"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DragAnswer, Question } from "@/types"

interface DragOrderPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
}

export function DragOrderPane({ question, answer, onChange }: DragOrderPaneProps) {
  const data = question.dragData
  if (!data || data.type !== "drag_order") return null

  const order =
    answer?.type === "drag_order" && answer.order.length > 0
      ? answer.order
      : data.items.map((item) => item.id)

  const rows = order
    .map((id) => data.items.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  function move(index: number, direction: -1 | 1) {
    const next = [...order]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange({ type: "drag_order", order: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Put the steps in the correct order using the arrows.
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {index + 1}
            </span>
            <p className="flex-1 text-sm">{item.text}</p>
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
          </div>
        ))}
      </div>
    </div>
  )
}
