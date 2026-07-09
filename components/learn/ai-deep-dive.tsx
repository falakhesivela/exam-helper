"use client"

import { AlertTriangle, BookOpen, ExternalLink, Lightbulb, RefreshCw, Scale } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Markdown, MarkdownInline } from "@/components/ui/markdown"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import type { TopicLessonContent } from "@/types"
import type { StreamingLessonContent } from "@/lib/ai/index"

interface AiDeepDiveProps {
  content?: TopicLessonContent
  loading: boolean
  /** Partial lesson snapshot while generation streams in. */
  streaming?: StreamingLessonContent | null
  onGenerate: () => void
  onRefresh?: () => void
  canGenerate: boolean
  limitMessage?: string
}

/** AI-generated deep-dive, traps, and recap sections. */
export function AiDeepDive({
  content,
  loading,
  streaming,
  onGenerate,
  onRefresh,
  canGenerate,
  limitMessage,
}: AiDeepDiveProps) {
  if (loading) {
    // Render sections as the model writes them; skeletons stand in for what
    // hasn't arrived yet.
    const sections = (streaming?.deepDive ?? []).filter((s) => s?.title?.trim())
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
          {sections.map((section, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <div className="text-sm leading-relaxed text-foreground/90">
                <MarkdownInline className="block">{section.body ?? ""}</MarkdownInline>
                {i === sections.length - 1 && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-primary align-middle" />
                )}
              </div>
            </div>
          ))}
          {sections.length === 0 ? (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <Skeleton className="h-4 w-1/2" />
          )}
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
              <Markdown className="text-sm leading-relaxed text-foreground/90">
                {section.body}
              </Markdown>
            </div>
          ))}
        </CardContent>
      </Card>

      {(content.comparisons ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="size-4 text-primary" />
              Decision tables
            </CardTitle>
            <CardDescription>When to choose which — compare at a glance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {(content.comparisons ?? []).map((table) => (
              <div key={table.title} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">{table.title}</h3>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-max text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {table.columns.map((col) => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-medium"
                          >
                            <MarkdownInline>{col}</MarkdownInline>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-border last:border-b-0"
                        >
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className={
                                j === 0
                                  ? "px-3 py-2 font-medium text-foreground/90"
                                  : "px-3 py-2 text-foreground/80"
                              }
                            >
                              <MarkdownInline>{cell}</MarkdownInline>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                <MarkdownInline className="flex-1">{trap}</MarkdownInline>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {(content.keyFacts ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4 text-primary" />
              Key facts to memorize
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {(content.keyFacts ?? []).map((f) => (
                <li
                  key={f.fact}
                  className="flex items-start gap-2 text-sm leading-relaxed text-foreground/90"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <MarkdownInline className="flex-1">{f.fact}</MarkdownInline>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick recap</CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown className="text-sm leading-relaxed text-foreground/90">
            {content.recap}
          </Markdown>
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
