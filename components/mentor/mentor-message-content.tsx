"use client"

import { useMemo } from "react"
import { ListChecks } from "lucide-react"
import { MentorQuizCard } from "@/components/mentor/mentor-quiz-card"
import { Markdown } from "@/components/ui/markdown"
import { parseMentorContent } from "@/lib/mentor/quiz-block"

interface MentorMessageContentProps {
  content: string
  /** While streaming, an unclosed quiz fence shows a placeholder, not raw JSON. */
  streaming?: boolean
  onFollowUp?: (prompt: string) => void
}

/**
 * Assistant reply body: markdown prose with `quiz` blocks swapped for
 * interactive cards. Segment order is stable for a given content string, so
 * index keys are safe — persisted messages never change.
 */
export function MentorMessageContent({
  content,
  streaming = false,
  onFollowUp,
}: MentorMessageContentProps) {
  const segments = useMemo(
    () => parseMentorContent(content, { streaming }),
    [content, streaming],
  )

  return (
    <>
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "markdown":
            return <Markdown key={index}>{segment.text}</Markdown>
          case "quiz":
            return (
              <MentorQuizCard
                key={index}
                quiz={segment.quiz}
                onFollowUp={onFollowUp}
              />
            )
          case "pending-quiz":
            return (
              <p
                key={index}
                className="my-2 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <ListChecks className="size-4 animate-pulse text-primary" />
                Preparing a quick check…
              </p>
            )
          case "invalid-quiz":
            return (
              <p key={index} className="my-2 text-xs text-muted-foreground">
                Mentor included a quick check that couldn&apos;t be displayed.
              </p>
            )
        }
      })}
    </>
  )
}
