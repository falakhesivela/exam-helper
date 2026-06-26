import { WifiOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Offline — Prepa",
}

/** Shown when navigation fails while the app is offline. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
        <WifiOff className="size-8 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re offline</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Prepa needs a connection for quizzes, AI tutoring, and syncing your
          progress. Cached pages may still be available once you reconnect.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Try again</Link>
      </Button>
    </div>
  )
}
