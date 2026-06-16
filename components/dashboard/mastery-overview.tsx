"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSessionStore } from "@/lib/store/use-session-store"

interface MasteryOverviewProps {
  mastery: number
}

/** Hero card: overall mastery as a radial ring plus a 7-day trend sparkline. */
export function MasteryOverview({ mastery }: MasteryOverviewProps) {
  const masteryTrend = useSessionStore((s) => s.masteryTrend)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dash = (mastery / 100) * circumference

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Overall mastery</CardTitle>
        <CardDescription>Across all topics you&apos;ve practiced</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <div className="relative flex size-36 shrink-0 items-center justify-center">
          <svg className="size-36 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--muted)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-semibold tracking-tight">{mastery}%</span>
            <span className="text-xs text-muted-foreground">mastery</span>
          </div>
        </div>

        <div className="w-full flex-1">
          <p className="mb-1 text-sm font-medium">7-day trend</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Steady improvement — keep your streak alive.
          </p>
          <div className="h-24 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 320, height: 96 }}
            >
              <AreaChart data={masteryTrend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="masteryFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="mastery"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#masteryFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
