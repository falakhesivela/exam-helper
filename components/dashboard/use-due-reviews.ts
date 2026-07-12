"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api/client"

/**
 * Cards due for spaced review today, across both sources — missed questions and
 * lesson key facts (null while loading). The old count asked only for missed
 * questions, so key facts were never counted.
 */
export function useDueReviewCount(): number | null {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .reviewQueue({ dueOnly: true })
      .then((res) => {
        if (!cancelled) setCount(res.dueCount)
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
