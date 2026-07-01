"use client"

import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSessionStore } from "@/lib/store/use-session-store"

/**
 * Wraps account-only surfaces (Profile, Team). Anonymous visitors see a
 * sign-up prompt instead of the feature; signed-in users see it normally.
 * The matching nav links are already hidden for anonymous users — this guards
 * direct navigation.
 */
export function AccountGate({
  feature,
  children,
}: {
  feature: string
  children: React.ReactNode
}) {
  const isAnonymous = useSessionStore((s) => s.profile.isAnonymous)
  if (!isAnonymous) return <>{children}</>

  const next = typeof window !== "undefined" ? window.location.pathname : "/"

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <LockKeyhole className="size-6 text-muted-foreground" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {feature} needs an account
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Create a free account to use {feature.toLowerCase()}. It takes a
          second and keeps your progress safe across devices.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild>
          <Link href={`/signup?next=${encodeURIComponent(next)}`}>
            Create free account
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
        </Button>
      </div>
    </div>
  )
}
