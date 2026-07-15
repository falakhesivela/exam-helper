"use client"

import Link from "next/link"
import { AlertTriangle, CircleCheck, CircleX, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ConfidenceBreakdown } from "@/lib/session-utils"
import { cn } from "@/lib/utils"

interface ConfidenceMatrixProps {
  breakdown: ConfidenceBreakdown
  sessionId: string
  /** Optional source note shown in the header, e.g. "last mock · SAA-C03". */
  context?: string
}

/**
 * Confidence × correctness quadrants. "Sure but wrong" is the quadrant that
 * fails real exams — those are misconceptions, not gaps, and the learner
 * won't find them by feel.
 */
export function ConfidenceMatrix({
  breakdown,
  sessionId,
  context,
}: ConfidenceMatrixProps) {
  if (breakdown.rated === 0) return null

  const cells = [
    {
      key: "solid",
      count: breakdown.solid,
      label: "Knew it",
      hint: "Sure and correct",
      icon: CircleCheck,
      tone: "text-success",
      href: null,
    },
    {
      key: "overconfident",
      count: breakdown.overconfident,
      label: "Misconception",
      hint: "Sure but wrong — review these first",
      icon: AlertTriangle,
      tone: "text-destructive",
      href: `/history/${sessionId}?filter=incorrect`,
      highlight: breakdown.overconfident > 0,
    },
    {
      key: "lucky",
      count: breakdown.lucky,
      label: "Lucky guess",
      hint: "Unsure but correct — not yet reliable",
      icon: Sparkles,
      tone: "text-chart-3",
      href: `/history/${sessionId}?filter=unsure`,
    },
    {
      key: "shaky",
      count: breakdown.shaky,
      label: "Known gap",
      hint: "Unsure and wrong — expected, fixable",
      icon: CircleX,
      tone: "text-muted-foreground",
      href: `/history/${sessionId}?filter=unsure`,
    },
  ] as const

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Confidence check</p>
          <p className="text-xs text-muted-foreground">
            {context ? `${context} · ` : ""}
            {breakdown.rated} rated
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cells.map((cell) => {
            const Icon = cell.icon
            const body = (
              <div
                className={cn(
                  "flex h-full flex-col gap-1 rounded-lg border border-border p-3",
                  "highlight" in cell && cell.highlight
                    ? "border-destructive/40 bg-destructive/5"
                    : "bg-secondary/30",
                  cell.href && "transition-colors hover:border-primary/40",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon className={cn("size-4", cell.tone)} />
                  <span className="text-lg font-semibold tabular-nums">
                    {cell.count}
                  </span>
                </span>
                <span className="text-sm font-medium">{cell.label}</span>
                <span className="text-xs text-muted-foreground">
                  {cell.hint}
                </span>
              </div>
            )
            return cell.href && cell.count > 0 ? (
              <Link key={cell.key} href={cell.href} className="h-full">
                {body}
              </Link>
            ) : (
              <div key={cell.key} className="h-full">
                {body}
              </div>
            )
          })}
        </div>
        {breakdown.overconfident > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-destructive">
              {breakdown.overconfident}{" "}
              {breakdown.overconfident === 1 ? "answer" : "answers"} you were
              sure about {breakdown.overconfident === 1 ? "was" : "were"} wrong.
            </span>{" "}
            These misconceptions cost the most on exam day — read their
            explanations before anything else.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
