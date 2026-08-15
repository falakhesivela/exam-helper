"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { backTargetFor } from "@/lib/config/back-nav"

const LINK_CLASS =
  "mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"

/**
 * Client-side route changes seen since load, tracked at module scope so it
 * survives the shell remounting (e.g. returning from a full-page quiz route).
 * `history.length` can't answer this: a tab opened from an external link
 * already reports 2, and popping that entry would leave the app entirely.
 */
let inAppNavigations = 0
let lastPathname: string | null = null

/**
 * One back control for every authenticated sub-page, placed by the app shell so
 * individual pages don't each invent their own. Nav destinations render nothing.
 */
export function BackBar() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (lastPathname !== null && lastPathname !== pathname) inAppNavigations += 1
    lastPathname = pathname
  }, [pathname])

  const target = backTargetFor(pathname)
  if (!target) return null

  if (target.href) {
    return (
      <Link href={target.href} className={LINK_CLASS}>
        <ArrowLeft className="size-4" />
        {target.label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={LINK_CLASS}
      onClick={() => {
        // Only pop an entry we put there; deep links land on Dashboard instead.
        if (inAppNavigations > 0) router.back()
        else router.push("/dashboard")
      }}
    >
      <ArrowLeft className="size-4" />
      {target.label}
    </button>
  )
}
