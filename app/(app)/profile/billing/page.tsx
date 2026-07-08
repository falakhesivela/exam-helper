"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AccountGate } from "@/components/auth/account-gate"
import { useSessionStore } from "@/lib/store/use-session-store"
import { api } from "@/lib/api/client"
import { PRO_PRICE_LABEL, PRO_PRICE_CYCLE } from "@/lib/config/pricing"
import type { SubscriptionDetails } from "@/types"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Human-friendly label + badge tone for a raw Paddle status. */
function statusLabel(status: string | null): {
  label: string
  variant: "default" | "secondary" | "destructive"
} {
  switch (status) {
    case "active":
      return { label: "Active", variant: "default" }
    case "trialing":
      return { label: "Trial", variant: "default" }
    case "past_due":
      return { label: "Past due", variant: "destructive" }
    case "paused":
      return { label: "Paused", variant: "secondary" }
    case "canceled":
      return { label: "Canceled", variant: "secondary" }
    default:
      return { label: status ?? "—", variant: "secondary" }
  }
}

export default function BillingPage() {
  const plan = useSessionStore((s) => s.profile.plan)
  const planExpiresAt = useSessionStore((s) => s.profile.planExpiresAt)
  const [sub, setSub] = useState<SubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .getSubscription()
      .then((res) => !cancelled && setSub(res))
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Couldn't load billing details",
          )
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCancel() {
    if (canceling) return
    setCanceling(true)
    try {
      const updated = await api.cancelSubscription()
      setSub(updated)
      toast.success("Your subscription will end at the close of this period.")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't cancel subscription",
      )
    } finally {
      setCanceling(false)
    }
  }

  const scheduledToCancel = !!sub?.cancelEffectiveAt
  const status = statusLabel(sub?.status ?? null)

  return (
    <AccountGate feature="Billing">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/profile">
              <ArrowLeft data-icon="inline-start" />
              Profile
            </Link>
          </Button>
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <CreditCard className="size-4 text-primary" />
            Billing & plan
          </p>
          <span className="w-20" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-6" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {error}
            </CardContent>
          </Card>
        ) : plan === "exam_pass" ? (
          // One-time Exam Pass purchase — no Paddle subscription to manage.
          <Card className="border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Sparkles className="size-6 text-primary" />
              <h1 className="text-lg font-semibold">Exam Pass active</h1>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                {planExpiresAt
                  ? `Full access until ${formatDate(planExpiresAt)}. Buy another pass any time to extend it.`
                  : "Full access for your 90-day exam window."}
              </p>
            </CardContent>
          </Card>
        ) : plan !== "pro" || !sub?.hasSubscription ? (
          // Free users (or anyone without a live Paddle subscription).
          <Card className="border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <Sparkles className="size-6 text-primary" />
              <h1 className="text-lg font-semibold">You&apos;re on the Free plan</h1>
              <p className="max-w-sm text-sm text-muted-foreground text-pretty">
                Upgrade for unlimited daily questions, full mock exams, and
                priority AI generation. Choose monthly Pro or a one-time Exam
                Pass.
              </p>
              <Button asChild className="mt-1">
                <Link href="/upgrade">
                  <Sparkles data-icon="inline-start" />
                  View plans
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Prepa Pro</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-0 p-0">
                <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">
                    {PRO_PRICE_LABEL}/{PRO_PRICE_CYCLE}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between px-6 py-3.5 text-sm">
                  <span className="text-muted-foreground">
                    {scheduledToCancel ? "Access ends" : "Renews on"}
                  </span>
                  <span className="font-medium">
                    {formatDate(
                      scheduledToCancel
                        ? sub.cancelEffectiveAt
                        : sub.nextBilledAt,
                    )}
                  </span>
                </div>
                {sub.updatePaymentUrl && (
                  <>
                    <Separator />
                    <a
                      href={sub.updatePaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 px-6 py-3.5 text-sm transition-colors hover:bg-secondary/50"
                    >
                      <span className="flex items-center gap-3">
                        <CreditCard className="size-4 text-muted-foreground" />
                        Update payment method
                      </span>
                      <ExternalLink className="size-4 text-muted-foreground" />
                    </a>
                  </>
                )}
              </CardContent>
            </Card>

            {scheduledToCancel ? (
              <p className="text-center text-sm text-muted-foreground text-pretty">
                Your Pro plan is set to cancel. You&apos;ll keep access until{" "}
                {formatDate(sub.cancelEffectiveAt)}.
              </p>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    Cancel subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Prepa Pro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll keep Pro access until{" "}
                      {formatDate(sub.nextBilledAt)}. After that your account
                      returns to the Free plan — no further charges.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={canceling}>
                      Keep Pro
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault()
                        void handleCancel()
                      }}
                      disabled={canceling}
                    >
                      {canceling ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {canceling ? "Canceling…" : "Cancel subscription"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </>
        )}
      </div>
    </AccountGate>
  )
}
