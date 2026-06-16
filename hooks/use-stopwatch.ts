"use client"

import { useEffect, useRef, useState } from "react"

/**
 * A simple running stopwatch (seconds). Can be reset, which is used to time
 * each individual quiz question.
 */
export function useStopwatch(running = true) {
  const [seconds, setSeconds] = useState(0)
  const startRef = useRef(Date.now())

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const reset = () => {
    startRef.current = Date.now()
    setSeconds(0)
  }

  return { seconds, reset }
}

/** Formats seconds as M:SS. */
export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
