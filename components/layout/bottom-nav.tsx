"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlarmClock, Compass, History, LayoutDashboard, User } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/intake", label: "Practice", icon: Compass },
  { href: "/exam", label: "Exam", icon: AlarmClock },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
]

/** Mobile-first bottom navigation bar. Hidden on large screens. */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
