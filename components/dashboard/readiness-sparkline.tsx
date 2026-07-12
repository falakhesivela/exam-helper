"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface ReadinessSparklineProps {
  data: { score: number }[]
}

/**
 * Recharts sparkline for the readiness card. Kept in its own module so the
 * chart library can be lazy-loaded instead of shipping with the dashboard
 * route bundle.
 */
export function ReadinessSparkline({ data }: ReadinessSparklineProps) {
  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 320, height: 64 }}
    >
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="readinessFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#readinessFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
