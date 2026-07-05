"use client"

import { Check, X } from "lucide-react"
import type { DragAnswer, Question } from "@/types"
import { cn } from "@/lib/utils"

interface SelectGridPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
  /** Locks interaction and marks each row correct/incorrect. */
  revealed?: boolean
}

/** Azure-style grid: each statement (row) is answered from shared columns. */
export function SelectGridPane({
  question,
  answer,
  onChange,
  revealed = false,
}: SelectGridPaneProps) {
  const data = question.dragData
  if (!data || data.type !== "select_grid") return null

  const selections =
    answer?.type === "select_grid" ? answer.selections : {}

  function select(rowId: string, columnId: string) {
    if (revealed) return
    onChange({
      type: "select_grid",
      selections: { ...selections, [rowId]: columnId },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {!revealed && (
        <p className="text-sm text-muted-foreground">
          Choose one option for each statement.
        </p>
      )}
      <div className="overflow-hidden rounded-md border border-border">
        <div
          className="grid items-stretch border-b bg-muted/40 text-xs font-medium text-muted-foreground"
          style={{
            gridTemplateColumns: `minmax(0,1fr) repeat(${data.columns.length}, minmax(3.5rem, max-content))`,
          }}
        >
          <div className="px-3 py-2">Statement</div>
          {data.columns.map((col) => (
            <div key={col.id} className="px-3 py-2 text-center">
              {col.label}
            </div>
          ))}
        </div>
        {data.rows.map((row, i) => {
          const correctColId = data.correctByRow[row.id]
          const rowCorrect = revealed && selections[row.id] === correctColId
          return (
            <div
              key={row.id}
              className={cn(
                "grid items-center",
                i < data.rows.length - 1 && "border-b border-border",
                revealed && (rowCorrect ? "bg-success/5" : "bg-destructive/5"),
              )}
              style={{
                gridTemplateColumns: `minmax(0,1fr) repeat(${data.columns.length}, minmax(3.5rem, max-content))`,
              }}
            >
              <div className="flex items-center gap-1.5 px-3 py-2.5 text-sm">
                {revealed &&
                  (rowCorrect ? (
                    <Check className="size-4 shrink-0 text-success" />
                  ) : (
                    <X className="size-4 shrink-0 text-destructive" />
                  ))}
                {row.statement}
              </div>
              {data.columns.map((col) => {
                const checked = selections[row.id] === col.id
                const isCorrectChoice = revealed && correctColId === col.id
                const isWrongChoice = revealed && checked && !isCorrectChoice
                return (
                  <div key={col.id} className="flex justify-center px-3 py-2.5">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      aria-label={`${row.statement}: ${col.label}`}
                      disabled={revealed}
                      onClick={() => select(row.id, col.id)}
                      className={cn(
                        "size-5 rounded-full border-2 transition-colors",
                        isCorrectChoice
                          ? "border-success bg-success"
                          : isWrongChoice
                            ? "border-destructive bg-destructive"
                            : checked
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40",
                        !revealed && !checked && "hover:border-primary",
                      )}
                    >
                      {(checked || isCorrectChoice) && (
                        <span className="block size-full scale-50 rounded-full bg-primary-foreground" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
