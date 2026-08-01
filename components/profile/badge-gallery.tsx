"use client"

import * as Icons from "lucide-react"
import { Award } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BADGE_CATALOG } from "@/lib/gamification/badges"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

/** Resolve a catalog icon name to its lucide component, falling back to Award. */
function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon =
    (Icons as unknown as Record<string, typeof Award>)[name] ?? Award
  return <Icon className={className} />
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Every badge in the catalog, with the locked ones dimmed to show what's next. */
export function BadgeGallery() {
  const gamification = useSessionStore((s) => s.gamification)

  const unlockedAt = new Map(
    (gamification?.unlockedBadges ?? []).map((b) => [b.badgeId, b.unlockedAt]),
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="size-4 text-primary" />
          Badges
        </CardTitle>
        <CardDescription>
          {unlockedAt.size} of {BADGE_CATALOG.length} unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {BADGE_CATALOG.map((badge) => {
            const earned = unlockedAt.get(badge.id)
            return (
              <div
                key={badge.id}
                title={
                  earned
                    ? `${badge.description} — unlocked ${formatDate(earned)}`
                    : badge.description
                }
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center",
                  earned
                    ? "border-primary/30 bg-primary/5"
                    : "border-border opacity-50",
                )}
              >
                <BadgeIcon
                  name={badge.icon}
                  className={cn(
                    "size-5",
                    earned ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-xs font-medium leading-tight">
                  {badge.name}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
