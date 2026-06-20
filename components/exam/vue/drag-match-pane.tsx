"use client"

import { useMemo, useState } from "react"
import type { DragAnswer, Question } from "@/types"
import { DragItemChip } from "./drag-item-chip"

interface DragMatchPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
}

export function DragMatchPane({ question, answer, onChange }: DragMatchPaneProps) {
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
      <p className="text-sm text-muted-foreground">
        Tap an item, then tap a target to assign. Tap an assigned item to remove it.
      </p>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Targets
        </p>
        {data.targets.map((target) => {
          const itemId = mapping[target.id]
          const item = data.items.find((i) => i.id === itemId)
          return (
            <div
              key={target.id}
              className="rounded-md border border-border bg-muted/30 p-3"
            >
              <p className="mb-2 text-sm font-medium">{target.label}</p>
              <DragItemChip
                label={item?.text ?? "Tap to assign"}
                assigned={Boolean(item)}
                onClick={() => {
                  if (item) clearTarget(target.id)
                  else assign(target.id)
                }}
              />
            </div>
          )
        })}
      </div>

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
    </div>
  )
}
