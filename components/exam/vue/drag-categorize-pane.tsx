"use client"

import { useMemo, useState } from "react"
import type { DragAnswer, Question } from "@/types"
import { DragItemChip } from "./drag-item-chip"

interface DragCategorizePaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
}

export function DragCategorizePane({
  question,
  answer,
  onChange,
}: DragCategorizePaneProps) {
  const data = question.dragData
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const buckets = useMemo(() => {
    if (answer?.type === "drag_categorize") return answer.buckets
    return {}
  }, [answer])

  if (!data || data.type !== "drag_categorize") return null
  const categorizeData = data

  const assignedIds = new Set(Object.values(buckets).flat())
  const pool = categorizeData.items.filter((item) => !assignedIds.has(item.id))

  function assign(categoryId: string) {
    if (!selectedItemId) return
    const next: Record<string, string[]> = {}
    for (const cat of categorizeData.categories) {
      const existing = (buckets[cat.id] ?? []).filter((id) => id !== selectedItemId)
      next[cat.id] = existing
    }
    next[categoryId] = [...(next[categoryId] ?? []), selectedItemId]
    onChange({ type: "drag_categorize", buckets: next })
    setSelectedItemId(null)
  }

  function removeItem(categoryId: string, itemId: string) {
    const next = { ...buckets }
    next[categoryId] = (next[categoryId] ?? []).filter((id) => id !== itemId)
    onChange({ type: "drag_categorize", buckets: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        Tap an item, then tap the category it belongs to.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {categorizeData.categories.map((category) => {
          const ids = buckets[category.id] ?? []
          return (
            <div
              key={category.id}
              className="rounded-md border border-border bg-muted/30 p-3"
            >
              <p className="mb-2 text-sm font-medium">{category.label}</p>
              <div className="flex min-h-12 flex-wrap gap-2">
                {ids.length === 0 ? (
                  <DragItemChip
                    label="Tap to assign"
                    onClick={() => assign(category.id)}
                  />
                ) : (
                  ids.map((itemId) => {
                    const item = categorizeData.items.find((i) => i.id === itemId)
                    if (!item) return null
                    return (
                      <DragItemChip
                        key={itemId}
                        label={item.text}
                        assigned
                        onClick={() => removeItem(category.id, itemId)}
                      />
                    )
                  })
                )}
              </div>
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
