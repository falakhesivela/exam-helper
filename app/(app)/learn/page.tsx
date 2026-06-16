"use client"

import { BookOpen } from "lucide-react"
import { LearnHub } from "@/components/learn/learn-hub"
import { useSessionStore } from "@/lib/store/use-session-store"

export default function LearnPage() {
  const learnTopics = useSessionStore((s) => s.learnTopics)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <BookOpen className="size-6 text-primary" />
          Learning
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Study your weakest topics with curated outlines and AI-powered
          deep-dives before your next practice session.
        </p>
      </header>
      <LearnHub topics={learnTopics} />
    </div>
  )
}
