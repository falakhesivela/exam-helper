"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"
import { publicPathname } from "@/lib/config/nav"
import { cn } from "@/lib/utils"

export interface TopicTab {
  href: string
  label: string
  count?: number
}

/**
 * Link-based tab bar. These are real routes, not client tabs: plan tasks and
 * the exam debrief deep-link straight to a tab, and the lab and drill are heavy
 * enough to be worth code-splitting. Rendered from the topic layout, so the
 * active indicator slides across route changes.
 *
 * Deliberately a <nav> with aria-current rather than a role="tablist" — faking
 * tab semantics on links is an accessibility anti-pattern, and this reads
 * identically.
 */
export function TopicTabs({ tabs }: { tabs: TopicTab[] }) {
  // Normalized because these pages prerender under their internal /study
  // pathname while tab hrefs (and the browser) use the public /learn URLs.
  const pathname = publicPathname(usePathname())

  return (
    <nav
      aria-label="Topic sections"
      className="no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {tab.count}
              </Badge>
            )}
            {active && (
              <motion.span
                layoutId="topic-tab-active"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
