import { NAV_ITEMS, publicPathname } from "@/lib/config/nav"

export interface BackTarget {
  /** Parent route to link to, or null to step back through history. */
  href: string | null
  label: string
}

/**
 * Routes that render their own back/exit affordance and must not get a second
 * one: the onboarding and Mentor surfaces. Mentor also sizes itself against the
 * viewport, so an extra row above it would push the composer off-screen.
 */
const SELF_MANAGED = ["/onboarding", "/mentor"]

/** Sub-routes whose parent isn't the first path segment. */
const FIXED: Record<string, BackTarget> = {
  "/intake": { href: "/practice", label: "Practice" },
}

/** Everything nested under these goes back to the section root. */
const SECTIONS: BackTarget[] = [
  { href: "/practice", label: "Practice" },
  { href: "/learn", label: "Learn" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
  { href: "/team", label: "Team" },
  { href: "/plan", label: "Plan" },
  { href: "/exam", label: "Exam" },
]

/**
 * Where "back" leads from `pathname`, or null when the page shouldn't show a
 * back control at all (nav destinations, and pages that ship their own).
 * Unmapped pages — /upgrade being the notable one, reachable from anywhere —
 * fall through to a history step rather than a guessed parent.
 */
export function backTargetFor(pathname: string): BackTarget | null {
  const path = publicPathname(pathname)

  if (NAV_ITEMS.some((item) => item.href === path)) return null
  if (SELF_MANAGED.some((p) => path === p || path.startsWith(`${p}/`))) return null

  const fixed = FIXED[path]
  if (fixed) return fixed

  const section = SECTIONS.find((s) => path.startsWith(`${s.href}/`))
  if (section) return section

  return { href: null, label: "Back" }
}
