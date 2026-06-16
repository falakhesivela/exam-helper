"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Flame, History, LayoutDashboard, User } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSessionStore } from "@/lib/store/use-session-store"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/intake", label: "Practice", icon: Compass },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
]

/** Sticky top bar. Shows desktop nav links and the user's streak. */
export function TopBar() {
  const pathname = usePathname()
  const profile = useSessionStore((s) => s.profile)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="CertForge home">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5">
            <Flame className="size-3.5 text-primary" />
            {profile.streakDays}
            <span className="hidden sm:inline">day streak</span>
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
        </div>
      </div>
    </header>
  )
}
