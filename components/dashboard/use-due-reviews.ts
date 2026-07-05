"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"

/** Count of missed questions due for spaced-repetition review today (null while loading). */
export function useDueReviewCount(): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .missedQuestions(true)
      .then((res) => {
        if (!cancelled) setCount(res.count)
      })
      .catch(() => {
        if (!cancelled) setCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return count
}
