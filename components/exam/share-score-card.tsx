"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface ShareScoreCardProps {
  examCode: string
  exam: string
  pct: number
  correct: number
  total: number
  passed: boolean
}

export function ShareScoreCard({
  examCode,
  exam,
  pct,
  correct,
  total,
  passed,
}: ShareScoreCardProps) {
  const [downloading, setDownloading] = useState(false)

  const params = new URLSearchParams({
    code: examCode,
    exam,
    pct: String(pct),
    correct: String(correct),
    total: String(total),
    pass: passed ? "1" : "0",
  })
  // OG image route stays on the Next.js frontend (uses next/og).
  const imagePath = `/api/share/score?${params.toString()}`
  const shareText = `I scored ${pct}% on a Prepa ${examCode} mock exam${passed ? " — passed! 🎉" : "."}`

  async function download() {
    if (downloading) return
    setDownloading(true)
    try {
      const res = await fetch(imagePath)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `prepa-${examCode.toLowerCase()}-score.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Couldn't generate the image.")
    } finally {
      setDownloading(false)
    }
  }

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${imagePath}`
        : imagePath
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Prepa", text: shareText, url })
      } catch {
        // user cancelled — ignore
      }
      return
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`)
      toast.success("Copied to clipboard!")
    } catch {
      toast.error("Couldn't copy.")
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5">
        <p className="text-sm font-medium">Share your result</p>
        <div className="overflow-hidden rounded-lg border border-border">
          <Image
            src={imagePath}
            alt={`${examCode} score ${pct}%`}
            width={1200}
            height={630}
            unoptimized
            className="h-auto w-full"
          />
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <Button onClick={() => void share()} className="flex-1">
            <Share2 data-icon="inline-start" />
            Share
          </Button>
          <Button
            variant="secondary"
            onClick={() => void download()}
            disabled={downloading}
            className="flex-1"
          >
            {downloading ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            Download image
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
