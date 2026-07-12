"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Counts down from `totalSeconds` to zero using a fixed deadline (so it stays
 * accurate even if the tab is backgrounded). Calls `onExpire` once when it
 * reaches zero. The deadline is anchored the first time `running` becomes true
 * — not at mount — so any time spent before the countdown starts (e.g. on a
 * pre-exam rules screen) isn't silently subtracted from the clock.
 */
export function useCountdown(
  totalSeconds: number,
  running: boolean,
  onExpire?: () => void,
  /**
   * Optional absolute deadline (epoch ms). When set — e.g. computed from a
   * server-anchored exam start — the countdown targets it directly, so the
   * clock survives reloads and resumes with the real remaining time.
   */
  deadlineMs?: number,
) {
  const initialRemaining =
    deadlineMs != null
      ? Math.max(0, Math.round((deadlineMs - Date.now()) / 1000))
      : totalSeconds
  const [remaining, setRemaining] = useState(initialRemaining)
  const deadlineRef = useRef<number | null>(deadlineMs ?? null)
  const onExpireRef = useRef(onExpire)
  const firedRef = useRef(false)

  useEffect(() => {
    onExpireRef.current = onExpire
  })

  // Until the countdown has started, keep the displayed value tracking its
  // source (`totalSeconds` / the deadline may arrive asynchronously).
  useEffect(() => {
    if (deadlineMs != null) {
      deadlineRef.current = deadlineMs
      setRemaining(Math.max(0, Math.round((deadlineMs - Date.now()) / 1000)))
      return
    }
    if (deadlineRef.current === null) setRemaining(totalSeconds)
  }, [totalSeconds, deadlineMs])

  useEffect(() => {
    if (!running) return

    // Anchor the deadline on the first tick after the countdown starts.
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + totalSeconds * 1000
    }
    const deadline = deadlineRef.current

    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpireRef.current?.()
      }
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [running, totalSeconds, deadlineMs])

  return remaining
}

/** Formats seconds as H:MM:SS when an hour or more, otherwise M:SS. */
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`
  return `${minutes}:${pad(seconds)}`
}
