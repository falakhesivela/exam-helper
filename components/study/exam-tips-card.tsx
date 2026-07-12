"use client"

import { useState } from "react"
import { ChevronDown, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

/** Collapsible exam-taking tips (static catalog content, zero AI cost). */
export function ExamTipsCard() {
  const tips = useSessionStore((s) => s.examTips)
  const activeExamCode = useSessionStore((s) => s.activeExamCode)
  const [open, setOpen] = useState(false)

  if (tips.length === 0) return null

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Target className="size-4 text-primary" />
          Exam tips{activeExamCode ? ` · ${activeExamCode}` : ""}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <CardContent className="flex flex-col gap-3 pt-0">
          {tips.map((tip) => (
            <div key={tip.title} className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {tip.body}
              </p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
