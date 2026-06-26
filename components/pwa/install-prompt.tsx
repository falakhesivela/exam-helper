"use client"

import { Download, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "certforge-pwa-install-dismissed"

/** Surfaces the native install prompt on supported browsers. */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(display-mode: standalone)").matches) return
    if (localStorage.getItem(DISMISS_KEY) === "1") return

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1")
    setVisible(false)
    setDeferredPrompt(null)
  }

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    dismiss()
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Install Prepa"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-lg rounded-xl border border-border bg-card p-4 shadow-lg md:bottom-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Download className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium">Install Prepa</p>
          <p className="text-sm text-muted-foreground">
            Add Prepa to your home screen for quick access while you study.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button type="button" size="sm" onClick={install}>
          Install
        </Button>
      </div>
    </div>
  )
}
