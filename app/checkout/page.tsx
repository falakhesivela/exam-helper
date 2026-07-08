"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  loadPaddle,
  onPaddleEvent,
  paddleConfigured,
  type PaddleApi,
} from "@/lib/paddle"

type Status = "loading" | "opening" | "no-transaction" | "completed" | "error"

/**
 * Public checkout landing — the account's Paddle "default payment link" points
 * here. When Paddle sends a customer back to pay (dunning/failed-payment
 * recovery, invoices, payment-method updates) it appends `?_ptxn=<id>`; Paddle.js
 * detects that on load and auto-opens the overlay for that transaction. This
 * page just needs Paddle.js initialized, which loadPaddle() handles.
 *
 * It lives outside the (app) group so it stays reachable when signed out — a
 * customer following an email link may not have an active session here.
 */
export default function CheckoutPage() {
  const [status, setStatus] = useState<Status>("loading")
  const paddleRef = useRef<PaddleApi | null>(null)
  const txnRef = useRef<string | null>(null)

  useEffect(() => {
    if (!paddleConfigured()) {
      setStatus("error")
      return
    }

    const txn = new URLSearchParams(window.location.search).get("_ptxn")
    txnRef.current = txn

    onPaddleEvent((event) => {
      if (event.name === "checkout.completed") setStatus("completed")
    })

    let cancelled = false
    loadPaddle().then((paddle) => {
      if (cancelled) return
      if (!paddle) {
        setStatus("error")
        return
      }
      paddleRef.current = paddle
      // Paddle.js auto-opens the overlay from the _ptxn param; we only switch
      // copy depending on whether a transaction is present.
      setStatus(txn ? "opening" : "no-transaction")
    })

    return () => {
      cancelled = true
      onPaddleEvent(null)
    }
  }, [])

  const resume = useCallback(() => {
    const txn = txnRef.current
    if (paddleRef.current && txn) {
      paddleRef.current.Checkout.open({ transactionId: txn })
    }
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        {status === "loading" && (
          <>
            <Spinner className="size-7" />
            <p className="text-sm text-muted-foreground">Preparing secure checkout…</p>
          </>
        )}

        {status === "opening" && (
          <>
            <ShieldCheck className="size-8 text-primary" aria-hidden />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Complete your payment</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Your secure checkout is opening. If it doesn&apos;t appear, tap
                the button below.
              </p>
            </div>
            <Button onClick={resume} className="w-full">
              Open checkout
            </Button>
          </>
        )}

        {status === "completed" && (
          <>
            <CheckCircle2 className="size-9 text-primary" aria-hidden />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Payment complete 🎉</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Thank you! Your Prepa Pro access is all set. It may take a moment
                to update on your account.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}

        {status === "no-transaction" && (
          <>
            <Sparkles className="size-8 text-primary" aria-hidden />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Nothing to pay here</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                This page opens a checkout from a payment link. To subscribe,
                head to the upgrade page.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/upgrade">
                <Sparkles data-icon="inline-start" />
                View plans
              </Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Checkout unavailable</h1>
              <p className="text-sm text-muted-foreground text-pretty">
                We couldn&apos;t load checkout right now. Please try again in a
                moment, or contact support if this keeps happening.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/upgrade">Back to plans</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
