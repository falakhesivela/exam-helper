"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { TopicMastery } from "@/types"

interface WeakTopicsProps {
  topics: TopicMastery[]
}

/** Lists the user's weakest topics with a quick way to drill in. */
export function WeakTopics({ topics }: WeakTopicsProps) {
  const weakest = [...topics].sort((a, b) => a.mastery - b.mastery).slice(0, 3)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          Focus areas
        </CardTitle>
        <CardDescription>Recommended topics to strengthen next</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {weakest.map((t) => (
          <div key={t.topic} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{t.topic}</span>
              <span className="text-muted-foreground">{t.mastery}%</span>
            </div>
            <Progress value={t.mastery} className="h-1.5" />
          </div>
        ))}
        <Button asChild variant="secondary" className="mt-1 w-full">
          <Link href="/intake">
            Practice weak topics
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
