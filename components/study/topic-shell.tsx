"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TopicTabs, type TopicTab } from "@/components/study/topic-tabs"
import { useSessionStore } from "@/lib/store/use-session-store"
import { isAssessed } from "@/components/study/topic-card"

/**
 * Persistent header and tab bar for one topic. Everything here comes from the
 * already-hydrated learnTopics store, so switching tabs costs no extra fetch.
 */
export function TopicShell({
  topicSlug,
  children,
}: {
  topicSlug: string
  children: ReactNode
}) {
  const topic = useSessionStore((s) =>
    s.learnTopics.find((t) => t.slug === topicSlug),
  )

  const base = `/study/${topicSlug}`
  const tabs: TopicTab[] = [
    { href: base, label: "Lesson" },
    // The lab tab only exists for topics that actually have one.
    ...(topic?.hasLab ? [{ href: `${base}/lab`, label: "Lab" }] : []),
    { href: `${base}/drill`, label: "Drill" },
    { href: `${base}/review`, label: "Review" },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Link
          href="/study"
          className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Study
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {topic?.topic ?? "Topic"}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {topic?.domainName && (
                <Badge variant="outline" className="text-xs">
                  {topic.domainName}
                  {topic.domainWeight ? ` · ${topic.domainWeight} of exam` : ""}
                </Badge>
              )}
            </div>
          </div>
          {topic && isAssessed(topic) && (
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {topic.mastery}% mastery
            </span>
          )}
        </div>

        <TopicTabs tabs={tabs} />
      </div>

      {children}
    </div>
  )
}
