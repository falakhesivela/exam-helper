"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Logo } from "@/components/layout/logo"
import { Spinner } from "@/components/ui/spinner"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

function authErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code)
    if (code === "over_email_send_rate_limit") {
      return "Email rate limit hit. For local dev, disable “Confirm email” in Supabase → Authentication → Providers → Email, or wait ~1 hour and try again."
    }
    if (code === "user_already_registered") {
      return "An account with this email already exists. Try signing in."
    }
  }
  return err instanceof Error ? err.message : "Authentication failed"
}

/** Internal-only ?next= target, defaulting to the dashboard. */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next")
  return next && next.startsWith("/") ? next : "/dashboard"
}

function goToApp() {
  window.location.assign(nextPath())
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" data-icon="inline-start">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [loading, setLoading] = useState(false)
  const [passwordMismatch, setPasswordMismatch] = useState(false)
  const isSignup = mode === "signup"

  async function handleGoogle() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Bare path (no query) so it matches the Supabase redirect allowlist
          // exactly; the callback defaults to /dashboard.
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // On success the browser redirects to Google; keep the spinner up.
    } catch (err) {
      toast.error(authErrorMessage(err))
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setPasswordMismatch(false)

    const form = new FormData(e.currentTarget)
    const email = String(form.get("email") ?? "")
    const password = String(form.get("password") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")
    const name = String(form.get("name") ?? "")

    if (isSignup && password !== confirmPassword) {
      setPasswordMismatch(true)
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        })
        if (error) throw error

        if (data.session) {
          toast.success("Account created — welcome to Prepa!")
          goToApp()
          return
        }

        // No session from sign-up (e.g. confirm email off but empty session) — sign in
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password })

        if (!signInError && signInData.session) {
          toast.success("Account created — welcome to Prepa!")
          goToApp()
          return
        }

        toast.success(
          "Account created. Check your email to confirm, then sign in.",
        )
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!data.session) {
        throw new Error("Sign-in succeeded but no session was returned.")
      }

      toast.success("Signed in")
      goToApp()
    } catch (err) {
      toast.error(authErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              {isSignup
                ? "Start forging your certification readiness today."
                : "Sign in to continue your study streak."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {isSignup && (
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jordan Lee"
                  autoComplete="name"
                  required
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={8}
              />
              {isSignup && (
                <FieldDescription>Use at least 8 characters.</FieldDescription>
              )}
            </Field>
            {isSignup && (
              <Field data-invalid={passwordMismatch}>
                <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  aria-invalid={passwordMismatch}
                />
                {passwordMismatch && (
                  <FieldDescription>Passwords do not match.</FieldDescription>
                )}
              </Field>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Spinner data-icon="inline-start" />}
              {isSignup ? "Create account" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New to Prepa? "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
            Privacy Notice
          </Link>
          <Link href="/refund" className="underline-offset-4 hover:text-foreground hover:underline">
            Refund Policy
          </Link>
        </nav>
      </div>
    </div>
  )
}
