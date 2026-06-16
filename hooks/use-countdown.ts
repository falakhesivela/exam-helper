"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Counts down from `totalSeconds` to zero using a fixed deadline (so it stays
 * accurate even if the tab is backgrounded). Calls `onExpire` once when it
 * reaches zero. The deadline is anchored on first mount and is not affected by
 * re-renders.
 */
export function useCountdown(
  totalSeconds: number,
  running: boolean,
  onExpire?: () => void,
) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const deadlineRef = useRef(Date.now() + totalSeconds * 1000)
  const onExpireRef = useRef(onExpire)
  const firedRef = useRef(false)

  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    if (!running) return

    const tick = () => {
      const left = Math.max(
        0,
        Math.round((deadlineRef.current - Date.now()) / 1000),
      )
      setRemaining(left)
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpireRef.current?.()
      }
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [running])

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
