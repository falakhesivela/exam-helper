"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ConfettiBurst } from "@/components/quiz/confetti-burst"
import { badgeById } from "@/lib/gamification/badges"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Celebrates badges the server has unlocked but the user hasn't seen yet.
 * Mounted once in the app shell so an unlock earned mid-session pops wherever
 * the learner happens to be.
 */
export function BadgeUnlockListener() {
  const gamification = useSessionStore((s) => s.gamification)
  const markBadgesSeen = useSessionStore((s) => s.markBadgesSeen)
  const [celebrating, setCelebrating] = useState(false)
  const shown = useRef(new Set<string>())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const unseen = gamification?.unseenBadgeIds

  useEffect(() => {
    if (!unseen || unseen.length === 0) return
    const fresh = unseen.filter((id) => !shown.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach((id) => shown.current.add(id))

    // Deferred a tick: <Toaster/> is mounted after the app shell, so a toast
    // published during this effect would be dropped before sonner subscribes.
    // Timers are held in a ref rather than returned as cleanup — marking the
    // badges seen changes `unseen`, which would otherwise cancel them
    // immediately and leave the confetti on screen forever.
    timers.current.push(
      setTimeout(() => {
        for (const id of fresh) {
          const badge = badgeById(id)
          toast.success(`Badge unlocked — ${badge?.name ?? "new badge"}`, {
            description: badge?.description,
          })
        }
        setCelebrating(true)
        timers.current.push(setTimeout(() => setCelebrating(false), 1600))
      }, 0),
    )
    void markBadgesSeen(fresh)
  }, [unseen, markBadgesSeen])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  if (!celebrating) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-50">
      <ConfettiBurst active />
    </div>
  )
}
