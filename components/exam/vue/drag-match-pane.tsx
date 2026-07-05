"use client"

import { useMemo, useState } from "react"
import { Check, X } from "lucide-react"
import type { DragAnswer, Question } from "@/types"
import { cn } from "@/lib/utils"
import { DragItemChip } from "./drag-item-chip"

interface DragMatchPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
  /** Locks interaction and shows correct/incorrect feedback per target. */
  revealed?: boolean
}

export function DragMatchPane({
  question,
  answer,
  onChange,
  revealed = false,
}: DragMatchPaneProps) {
  const data = question.dragData
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const mapping = useMemo(() => {
    if (answer?.type === "drag_match") return answer.mapping
    return {}
  }, [answer])

  if (!data || data.type !== "drag_match") return null

  const assignedItemIds = new Set(Object.values(mapping))
  const pool = data.items.filter((item) => !assignedItemIds.has(item.id))

  function assign(targetId: string) {
    if (!selectedItemId) return
    const next = { ...mapping, [targetId]: selectedItemId }
    onChange({ type: "drag_match", mapping: next })
    setSelectedItemId(null)
  }

  function clearTarget(targetId: string) {
    const next = { ...mapping }
    delete next[targetId]
    onChange({ type: "drag_match", mapping: next })
  }

  return (
    <div className="flex flex-col gap-5">
      {!revealed && (
        <p className="text-sm text-muted-foreground">
          Tap an item, then tap a target to assign. Tap an assigned item to remove it.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Targets
        </p>
        {data.targets.map((target) => {
          const itemId = mapping[target.id]
          const item = data.items.find((i) => i.id === itemId)
          const correctItemId = data.correctMatch[target.id]
          const isCorrect = revealed && itemId != null && itemId === correctItemId
          const isWrong = revealed && itemId !== correctItemId
          const correctItem = data.items.find((i) => i.id === correctItemId)
          return (
            <div
              key={target.id}
              className={cn(
                "rounded-md border p-3",
                revealed
                  ? isCorrect
                    ? "border-success/50 bg-success/10"
                    : "border-destructive/50 bg-destructive/10"
                  : "border-border bg-muted/30",
              )}
            >
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                {revealed &&
                  (isCorrect ? (
                    <Check className="size-4 shrink-0 text-success" />
                  ) : (
                    <X className="size-4 shrink-0 text-destructive" />
                  ))}
                {target.label}
              </p>
              <DragItemChip
                label={item?.text ?? (revealed ? "Not assigned" : "Tap to assign")}
                assigned={Boolean(item)}
                onClick={
                  revealed
                    ? undefined
                    : () => {
                        if (item) clearTarget(target.id)
                        else assign(target.id)
                      }
                }
              />
              {isWrong && correctItem && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Correct: <span className="text-success">{correctItem.text}</span>
                </p>
              )}
            </div>
          )
        })}
      </div>

      {!revealed && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Items
          </p>
          <div className="flex flex-wrap gap-2">
            {pool.map((item) => (
              <DragItemChip
                key={item.id}
                label={item.text}
                selected={selectedItemId === item.id}
                onClick={() =>
                  setSelectedItemId((prev) => (prev === item.id ? null : item.id))
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
