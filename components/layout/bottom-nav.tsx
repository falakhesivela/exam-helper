"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AlarmClock,
  BookOpen,
  CalendarCheck,
  Compass,
  History,
  LayoutDashboard,
  Menu,
  User,
} from "lucide-react"
import { motion } from "motion/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// Most-used destinations stay on the bar; the rest live in the "More" drawer.
const primaryItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/intake", label: "Practice", icon: Compass },
  { href: "/plan", label: "Plan", icon: CalendarCheck },
  { href: "/exam", label: "Exam", icon: AlarmClock },
]

const moreItems = [
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
]

/** Mobile-first bottom navigation with a "More" drawer for overflow items. */
export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
  const moreActive = moreItems.some((item) => isActive(item.href))

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
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

        <li className="flex-1">
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger
              className={cn(
                "relative flex w-full flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
              aria-label="More navigation"
            >
              <Menu className="size-5" />
              More
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <ul className="flex flex-col gap-1 px-2">
                {moreItems.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href)
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="size-5" />
                        {label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  )
}
