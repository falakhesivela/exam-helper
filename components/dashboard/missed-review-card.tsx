"use client"

import Link from "next/link"
import { Brain, CalendarClock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/** Links to missed-question and spaced-repetition review decks. */
export function MissedReviewCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="size-4 text-primary" />
          Review your misses
        </CardTitle>
        <CardDescription>
          Retry questions you got wrong with instant feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/practice/missed">All missed questions</Link>
        </Button>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/practice/missed?due=true">
            <CalendarClock data-icon="inline-start" />
            Due for review today
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
