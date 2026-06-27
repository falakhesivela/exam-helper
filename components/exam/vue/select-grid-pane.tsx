"use client"

import type { DragAnswer, Question } from "@/types"
import { cn } from "@/lib/utils"

interface SelectGridPaneProps {
  question: Question
  answer?: DragAnswer
  onChange: (answer: DragAnswer) => void
}

/** Azure-style grid: each statement (row) is answered from shared columns. */
export function SelectGridPane({ question, answer, onChange }: SelectGridPaneProps) {
  const data = question.dragData
  if (!data || data.type !== "select_grid") return null

  const selections =
    answer?.type === "select_grid" ? answer.selections : {}

  function select(rowId: string, columnId: string) {
    onChange({
      type: "select_grid",
      selections: { ...selections, [rowId]: columnId },
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Choose one option for each statement.
      </p>
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
        {data.rows.map((row, i) => (
          <div
            key={row.id}
            className={cn(
              "grid items-center",
              i < data.rows.length - 1 && "border-b border-border",
            )}
            style={{
              gridTemplateColumns: `minmax(0,1fr) repeat(${data.columns.length}, minmax(3.5rem, max-content))`,
            }}
          >
            <div className="px-3 py-2.5 text-sm">{row.statement}</div>
            {data.columns.map((col) => {
              const checked = selections[row.id] === col.id
              return (
                <div key={col.id} className="flex justify-center px-3 py-2.5">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={`${row.statement}: ${col.label}`}
                    onClick={() => select(row.id, col.id)}
                    className={cn(
                      "size-5 rounded-full border-2 transition-colors",
                      checked
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40 hover:border-primary",
                    )}
                  >
                    {checked && (
                      <span className="block size-full scale-50 rounded-full bg-primary-foreground" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
