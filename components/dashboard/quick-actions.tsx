"use client"

import Link from "next/link"
import {
  AlarmClock,
  Bookmark,
  Layers,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const ACTIONS = [
  { href: "/exam", label: "Timed mock exam", icon: AlarmClock },
  { href: "/intake", label: "Custom practice", icon: Sparkles },
  { href: "/practice/review", label: "Flashcards", icon: Layers },
  {
    href: "/practice/review?mode=quiz",
    label: "Missed questions",
    icon: RotateCcw,
  },
  { href: "/practice/saved", label: "Saved questions", icon: Bookmark },
]

/** Quiet rail of secondary destinations — one tap away without competing with the recommendation. */
export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(({ href, label, icon: Icon }) => (
        <Button
          key={href}
          asChild
          variant="outline"
          size="sm"
          className="rounded-full text-muted-foreground hover:text-foreground"
        >
          <Link href={href}>
            <Icon data-icon="inline-start" />
            {label}
          </Link>
        </Button>
      ))}
    </div>
  )
}
