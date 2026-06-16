"use client"

import { AlertTriangle, BookOpen, ExternalLink, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import type { TopicLessonContent } from "@/types"

interface AiDeepDiveProps {
  content?: TopicLessonContent
  loading: boolean
  onGenerate: () => void
  onRefresh?: () => void
  canGenerate: boolean
  limitMessage?: string
}

/** AI-generated deep-dive, traps, and recap sections. */
export function AiDeepDive({
  content,
  loading,
  onGenerate,
  onRefresh,
  canGenerate,
  limitMessage,
}: AiDeepDiveProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" />
            Personalized deep dive
          </CardTitle>
          <CardDescription>Generating your AI lesson…</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="size-4 text-primary" />
            Personalized deep dive
          </CardTitle>
          <CardDescription>
            AI-generated explanations tailored to your mastery level
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Generate a personalized lesson with concept explanations, common
            exam traps, and a quick recap.
          </p>
          {limitMessage && (
            <p className="text-xs text-muted-foreground">{limitMessage}</p>
          )}
          <Button onClick={onGenerate} disabled={!canGenerate || loading} className="w-full sm:w-fit">
            {loading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <BookOpen data-icon="inline-start" />
            )}
            {loading ? "Generating…" : "Generate AI lesson"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-primary" />
              Deep dive
            </CardTitle>
            <CardDescription>Personalized for your mastery level</CardDescription>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
              {loading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {content.deepDive.map((section) => (
            <div key={section.title} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="text-sm leading-relaxed text-foreground/90">
                {section.body}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="size-4 text-amber-500" />
            Common exam traps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {content.commonTraps.map((trap) => (
              <li
                key={trap}
                className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                {trap}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick recap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">
            {content.recap}
          </p>
        </CardContent>
      </Card>

      {content.references.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Additional references</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {content.references.map((ref) => (
              <a
                key={ref.url}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                {ref.label}
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
