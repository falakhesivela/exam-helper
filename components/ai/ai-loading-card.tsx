"use client"

import { Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AiLoadingCardProps {
  title: string
  description: string
  /** Optional hint shown below the skeleton (e.g. expected wait time). */
  hint?: string
  variant?: "skeleton" | "spinner"
}

/** Shared loading state for AI operations — shows animated feedback while waiting for the model. */
export function AiLoadingCard({
  title,
  description,
  hint,
  variant = "skeleton",
}: AiLoadingCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            {variant === "spinner" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {variant === "skeleton" ? (
          <>
            <Skeleton className="h-10 w-full rounded-2xl" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            <Skeleton className="h-10 w-4/5 rounded-2xl" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-32 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {hint ?? "This usually takes 10–30 seconds…"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
