"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlarmClock, BookOpen, CalendarCheck, Compass, Flame, History, LayoutDashboard, User, Users } from "lucide-react"
import { ExamSwitcher } from "@/components/layout/exam-switcher"
import { Logo } from "@/components/layout/logo"
import { UsageMeter } from "@/components/layout/usage-meter"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/practice", label: "Practice", icon: Compass },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/plan", label: "Plan", icon: CalendarCheck },
  { href: "/exam", label: "Exam", icon: AlarmClock },
  { href: "/history", label: "History", icon: History },
  // Account-only — hidden for anonymous (not-signed-in) visitors.
  { href: "/team", label: "Team", icon: Users, accountOnly: true },
  { href: "/profile", label: "Profile", icon: User, accountOnly: true },
]

/** Sticky top bar. Shows desktop nav links and the user's streak. */
export function TopBar() {
  const pathname = usePathname()
  const profile = useSessionStore((s) => s.profile)
  const isAnonymous = profile.isAnonymous
  const visibleNav = navItems.filter((i) => !i.accountOnly || !isAnonymous)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="Prepa home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden min-w-0 items-center gap-0.5 xl:flex">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <ExamSwitcher />
          <UsageMeter />
          {isAnonymous ? (
            <>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          ) : profile.name ? (
            <>
              <Badge variant="secondary" className="gap-1.5">
                <Flame className="size-3.5 text-primary" />
                {profile.streakDays}
                {/* Hidden once the desktop nav appears (≥xl) to save room. */}
                <span className="hidden sm:inline xl:hidden">day streak</span>
                <span className="hidden xl:inline">d</span>
              </Badge>
              <Link href="/profile" aria-label="Your profile">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-secondary text-sm font-medium">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
