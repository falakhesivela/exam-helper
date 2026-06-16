"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { TopicMastery } from "@/types"
import { resolveTopicName } from "@/lib/learning/topic-resolver"

interface WeakTopicsProps {
  topics: TopicMastery[]
  examCode?: string
}

/** Lists the user's weakest topics with a quick way to study or drill in. */
export function WeakTopics({ topics, examCode = "SAA-C03" }: WeakTopicsProps) {
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
        {weakest.map((t) => {
          const resolved = resolveTopicName(t.topic, examCode)
          return (
            <Link
              key={t.topic}
              href={`/learn/${resolved.slug}`}
              className="flex flex-col gap-1.5 rounded-lg transition-colors hover:bg-muted/50 -mx-2 px-2 py-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t.topic}</span>
                <span className="text-muted-foreground">{t.mastery}%</span>
              </div>
              <Progress value={t.mastery} className="h-1.5" />
            </Link>
          )
        })}
        <Button asChild variant="secondary" className="mt-1 w-full">
          <Link href="/learn">
            Go to Learning
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <Link
          href="/intake"
          className="text-center text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
        >
          Jump to practice instead
        </Link>
      </CardContent>
    </Card>
  )
}
