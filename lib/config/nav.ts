import {
  AlarmClock,
  CalendarCheck,
  GraduationCap,
  History,
  LayoutDashboard,
  Sparkles,
  Target,
  User,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  href: string
  /** Shown on the desktop top bar. */
  label: string
  /** Shorter label for the mobile bar, where space is tight. */
  shortLabel?: string
  icon: LucideIcon
  /** On the mobile bottom bar rather than in the "More" drawer. */
  primary?: boolean
  /** Hidden from anonymous (not-signed-in) visitors. */
  accountOnly?: boolean
}

/**
 * The single nav definition, consumed by both the desktop top bar and the
 * mobile bottom bar. Learn and Practice are separate destinations because they
 * serve different intents: building knowledge and testing it.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    primary: true,
  },
  { href: "/practice", label: "Practice", icon: Target, primary: true },
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/mentor", label: "Mentor", icon: Sparkles, primary: true },
  { href: "/exam", label: "Exam", icon: AlarmClock, primary: true },
  { href: "/plan", label: "Plan", icon: CalendarCheck },
  { href: "/history", label: "History", icon: History },
  { href: "/team", label: "Team", icon: Users, accountOnly: true },
  { href: "/profile", label: "Profile", icon: User, accountOnly: true },
]

export function visibleNavItems(isAnonymous: boolean): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.accountOnly || !isAnonymous)
}

/** Active for the destination itself and anything nested under it. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
