"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PracticeHeaderProps {
  title: string
  /** Optional right-side action (e.g. shuffle button). */
  action?: React.ReactNode
}

/** Consistent back navigation for practice sub-pages. */
export function PracticeHeader({ title, action }: PracticeHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/practice">
          <ArrowLeft data-icon="inline-start" />
          Practice
        </Link>
      </Button>
      <p className="text-sm font-medium">{title}</p>
      {action ?? <span className="w-20" />}
    </div>
  )
}
