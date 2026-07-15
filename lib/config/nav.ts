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
  /**
   * Kept out of the desktop top bar (still in the mobile "More" drawer).
   * The bar's max-w-6xl row fits 7 links beside the switcher and meter;
   * more than that and the right cluster paints over the trailing links.
   */
  desktopHidden?: boolean
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
  // Desktop reaches Team via the profile page and Profile via the avatar.
  { href: "/team", label: "Team", icon: Users, accountOnly: true, desktopHidden: true },
  { href: "/profile", label: "Profile", icon: User, accountOnly: true, desktopHidden: true },
]

export function visibleNavItems(isAnonymous: boolean): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.accountOnly || !isAnonymous)
}

/** Items for the desktop top bar, which has room for fewer links. */
export function desktopNavItems(isAnonymous: boolean): NavItem[] {
  return visibleNavItems(isAnonymous).filter((i) => !i.desktopHidden)
}

/**
 * The Study implementations are served under /learn and /practice via
 * rewrites (next.config.mjs). Prerendering runs with the internal /study
 * pathname while the browser has the public URL, so both must normalize to
 * the same value here — otherwise the active-link markup differs and every
 * rewritten page hydration-errors.
 */
export function publicPathname(pathname: string): string {
  if (pathname === "/study/review" || pathname.startsWith("/study/review/")) {
    return "/practice/review"
  }
  if (pathname === "/study/saved" || pathname.startsWith("/study/saved/")) {
    return "/practice/saved"
  }
  if (pathname.startsWith("/study/")) {
    return `/learn${pathname.slice("/study".length)}`
  }
  return pathname
}

/** Active for the destination itself and anything nested under it. */
export function isNavItemActive(pathname: string, href: string): boolean {
  const path = publicPathname(pathname)
  return path === href || path.startsWith(`${href}/`)
}
