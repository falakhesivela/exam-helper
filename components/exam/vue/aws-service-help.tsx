"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import { AWS_SERVICE_ABBREVIATIONS } from "@/lib/exams/aws-service-abbreviations"
import { cn } from "@/lib/utils"

export function AwsServiceHelp() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <HelpCircle className="size-4 shrink-0 text-primary" />
          AWS service abbreviations
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="max-h-48 overflow-y-auto border-t border-border px-3 py-2">
          <dl className="grid gap-1.5 text-xs sm:grid-cols-2">
            {AWS_SERVICE_ABBREVIATIONS.map((row) => (
              <div key={row.abbr} className="flex gap-2">
                <dt className="w-16 shrink-0 font-semibold text-foreground">
                  {row.abbr}
                </dt>
                <dd className="text-muted-foreground">{row.name}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
